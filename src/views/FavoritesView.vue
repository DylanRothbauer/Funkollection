<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '@/firebase'
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import PopDetailsDialog from '@/components/PopDetailsDialog.vue'

const user = ref(null)
const favorites = ref([])
const loading = ref(true)
const viewedFunko = ref(null)
const showViewDialog = ref(false)
const toast = useToast()

async function fetchFavorites() {
  if (!user.value) return
  const favSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'favorites'))
  const funkoDetails = await Promise.all(
    favSnapshot.docs.map(async (favDoc) => {
      const favoriteData = favDoc.data()
      const favoriteKey = favDoc.id
      const favoriteFunkoId = favoriteData?.funkoId || null

      // Resolve favorites from the user's own collection entry if available.
      if (favoriteData?.funkoDocId) {
        const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', favoriteData.funkoDocId)
        const userFunkoSnap = await getDoc(userFunkoRef)
        if (userFunkoSnap.exists()) {
          const ud = userFunkoSnap.data()
          let catalogImage = ''
          if (ud.funkoId) {
            const q = query(collection(db, 'FunkoPops'), where('funkoId', '==', ud.funkoId))
            const snap = await getDocs(q)
            if (!snap.empty) catalogImage = snap.docs[0].data().image || ''
          }
          return {
            docId: favoriteKey,
            id: ud.funkoId || favoriteFunkoId || favoriteKey,
            name: ud.name || '',
            title: ud.title || '',
            series: ud.series || '',
            image: ud.image || catalogImage || '',
            purchasePrice: ud.purchasePrice !== undefined ? ud.purchasePrice : '',
          }
        }
      }

      // If the favorite record stores the actual Funko pop ID, use it.
      if (favoriteFunkoId) {
        const q = query(collection(db, 'FunkoPops'), where('funkoId', '==', favoriteFunkoId))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const data = snap.docs[0].data()
          return {
            docId: favoriteKey,
            id: favoriteFunkoId,
            name: data.name || '',
            title: data.title || '',
            series: data.series || '',
            image: data.image || '',
            purchasePrice: '',
          }
        }
      }

      // Fallback: preserve the favorite doc ID internally, but do not show it as the pop ID unless no other data exists.
      return {
        docId: favoriteKey,
        id: favoriteFunkoId || favoriteKey,
        name: favoriteData?.name || '',
        title: favoriteData?.title || '',
        series: favoriteData?.series || '',
        image: favoriteData?.image || '',
        purchasePrice: favoriteData?.purchasePrice ?? '',
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
    <h2 class="text-2xl font-bold mb-4" style="padding-bottom: 1rem;">My Favorites</h2>

    <div v-if="loading" class="p-4">Loading favorites...</div>
    <div v-else>
      <div v-if="favorites.length === 0" class="p-4">No favorites yet.</div>
      <div v-else>

        <!-- Mobile Card View -->
        <div class="mobile-cards">
          <div v-for="funko in favorites" :key="funko.docId || funko.id" class="mobile-card">
            <div class="mobile-card-header">
              <img v-if="funko.image" :src="funko.image" :alt="funko.name" class="mobile-card-img" />
              <div>
                <div class="mobile-card-name">{{ funko.name }}</div>
                <div class="mobile-card-sub">{{ funko.title }}</div>
                <div class="mobile-card-sub">{{ funko.series }}</div>
              </div>
            </div>
            <div class="mobile-card-actions">
              <Button icon="pi pi-eye" outlined rounded severity="info" @click="viewFunko(funko)" />
            </div>
          </div>
        </div>

        <!-- Desktop Table View -->
        <table class="desktop-table min-w-full table-auto border-collapse">
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
            <tr v-for="funko in favorites" :key="funko.docId || funko.id" class="hover:bg-gray-100">
              <td class="px-4 py-2">
                <img v-if="funko.image" :src="funko.image" alt="Funko Image" class="w-16 h-16 object-cover rounded" />
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
    </div>

    <!-- View Dialog -->
    <PopDetailsDialog v-model:visible="showViewDialog" :funko="viewedFunko" />
  </div>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 900px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

th, td {
  border-bottom: 1px solid #e5e7eb;
}

/* Mobile cards - visible by default */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-card {
  background: var(--funkollection-background, #f9f9f9);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-card-header {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.mobile-card-img {
  width: 4rem;
  height: 4rem;
  object-fit: contain;
  border-radius: 8px;
}

.mobile-card-name {
  font-weight: 700;
  font-size: 1rem;
}

.mobile-card-sub {
  font-size: 0.85rem;
  color: #888;
}

.mobile-card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Desktop table - hidden by default */
.desktop-table {
  display: none;
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.06);
}

.desktop-table th,
.desktop-table td {
  padding: 1rem 1.25rem;
  text-align: left;
}

.desktop-table th {
  background: var(--funkollection-secondary);
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid rgba(255,255,255,0.16);
}

.desktop-table tbody tr:nth-child(even) {
  background: #f4faf4;
}

.desktop-table tbody tr:hover {
  background: #edf7eb;
}

/* Switch at md breakpoint */
@media (min-width: 768px) {
  .mobile-cards {
    display: none !important;
  }

  .desktop-table {
    display: table;
  }
}
</style>