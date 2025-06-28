<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '@/firebase'
import { collection, getDocs, getDoc, doc } from 'firebase/firestore'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const user = ref(null)
const favorites = ref([])
const loading = ref(true)
const viewedFunko = ref(null)
const showViewDialog = ref(false)
const toast = useToast()

async function fetchFavorites() {
  if (!user.value) return
  const favSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'favorites'))
  const favIds = favSnapshot.docs.map((doc) => doc.id)
  // Fetch Funko details for each favorite
  const funkoDetails = await Promise.all(
    favIds.map(async (id) => {
      const funkoDoc = await getDoc(doc(db, 'FunkoPops', id))
      if (funkoDoc.exists()) {
        const data = funkoDoc.data()
        // Try to get user-specific image/title/name/series if available
        const userFunkoDoc = await getDoc(doc(db, 'users', user.value.uid, 'funkos', id))
        const userData = userFunkoDoc.exists() ? userFunkoDoc.data() : {}
        return {
          id,
          name: userData.name || data.name || '',
          title: userData.title || data.title || '',
          series: userData.series || data.series || '',
          image: userData.image || data.image || '',
        }
      } else {
        return { id, name: '', title: '', series: '', image: '' }
      }
    }),
  )
  favorites.value = funkoDetails
}

function viewFunko(funko) {
  viewedFunko.value = funko
  showViewDialog.value = true
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      await fetchFavorites()
    }
    loading.value = false
  })
})
</script>

<template>
  <div class="card">
    <h2 class="text-2xl font-bold mb-4">My Favorites</h2>
    <div v-if="loading" class="p-4">Loading favorites...</div>
    <div v-else>
      <div v-if="favorites.length === 0" class="p-4">No favorites yet.</div>
      <table v-else class="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th class="px-4 py-2">Image</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Title</th>
            <th class="px-4 py-2">Series</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="funko in favorites" :key="funko.id" class="hover:bg-gray-100">
            <td class="px-4 py-2">
              <img
                v-if="funko.image"
                :src="funko.image"
                alt="Funko Image"
                class="w-16 h-16 object-cover rounded"
              />
            </td>
            <td class="px-4 py-2">{{ funko.name }}</td>
            <td class="px-4 py-2">{{ funko.title }}</td>
            <td class="px-4 py-2">{{ funko.series }}</td>
            <td class="px-4 py-2">
              <Button icon="pi pi-eye" outlined rounded severity="info" @click="viewFunko(funko)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Dialog
      v-model:visible="showViewDialog"
      modal
      header="Funko Pop Details"
      :style="{ width: '700px', maxWidth: '98vw' }"
    >
      <div v-if="viewedFunko" class="flex flex-col items-center p-8">
        <img
          v-if="viewedFunko.image"
          :src="viewedFunko.image"
          alt="Funko Image"
          class="w-96 h-96 object-cover rounded mb-8 border shadow-lg"
        />
        <div class="text-3xl font-bold mb-4">{{ viewedFunko.name }}</div>
        <div class="mb-3 text-xl">
          <span class="font-semibold">Title:</span> {{ viewedFunko.title }}
        </div>
        <div class="mb-3 text-xl">
          <span class="font-semibold">Series:</span> {{ viewedFunko.series }}
        </div>
        <div class="mb-3 text-xl"><span class="font-semibold">ID:</span> {{ viewedFunko.id }}</div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.card {
  background: var(--funkollection-background);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 900px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
th,
td {
  border-bottom: 1px solid #e5e7eb;
}
</style>
