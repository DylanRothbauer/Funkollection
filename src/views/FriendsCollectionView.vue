<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase.js'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useRoute, useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import { InputText, IconField, InputIcon } from 'primevue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const auth = getAuth()
const route = useRoute()
const router = useRouter()

const friendId = route.params.friendId
const friendName = ref('')
const funkos = ref([])
const isLoading = ref(true)
const showViewDialog = ref(false)
const viewedFunko = ref(null)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

onMounted(async () => {
  // Fetch friend's display name
  const friendDoc = await getDoc(doc(db, 'users', friendId))
  if (friendDoc.exists()) {
    friendName.value = friendDoc.data().displayName || 'Friend'
  }

  await fetchFriendCollection()
})

async function fetchFriendCollection() {
  isLoading.value = true
  try {
    const userFunkosSnap = await getDocs(collection(db, 'users', friendId, 'funkos'))
    const userFunkos = userFunkosSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const funkoDetails = await Promise.all(
      userFunkos.map(async (userFunko) => {
        const funkoDoc = await getDoc(doc(db, 'FunkoPops', userFunko.id))
        if (funkoDoc.exists()) {
          const data = funkoDoc.data()
          return {
            id: userFunko.id || '',
            name: data.name || '',
            title: data.title || '',
            series: data.series || '',
            image: userFunko.image || '',
            purchasePrice: userFunko.purchasePrice !== undefined ? userFunko.purchasePrice : '',
            stickers: userFunko.stickers || [],
          }
        } else {
          return {
            id: userFunko.id || '',
            name: '',
            title: '',
            series: '',
            image: userFunko.image || '',
            purchasePrice: userFunko.purchasePrice !== undefined ? userFunko.purchasePrice : '',
            stickers: userFunko.stickers || [],
          }
        }
      })
    )
    funkos.value = funkoDetails
  } catch (e) {
    console.error('Error fetching friend collection:', e)
  }
  isLoading.value = false
}

const filteredFunkos = computed(() => {
  const search = filters.value.global.value?.toLowerCase() || ''
  if (!search) return funkos.value
  return funkos.value.filter(f =>
    [f.name, f.title, f.series, f.id].some(v => v?.toLowerCase().includes(search))
  )
})

function viewFunko(funko) {
  viewedFunko.value = funko
  showViewDialog.value = true
}
</script>

<template>
  <div class="friend-collection-container">

    <!-- Header -->
    <header class="flex items-center justify-between p-4 bg-white shadow-sm rounded-b-lg mb-6">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" text @click="router.back()" />
        <div>
          <h1 class="text-2xl font-bold text-gray-800">{{ friendName }}'s Collection</h1>
          <p class="text-sm text-gray-400">{{ funkos.length }} Funko Pops</p>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--funkollection-secondary)"></i>
    </div>

    <div v-else>
      <!-- Empty state -->
      <div v-if="funkos.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-box text-5xl mb-4"></i>
        <p class="text-lg">{{ friendName }} hasn't added any Pops yet.</p>
      </div>

      <div v-else>
        <!-- Search toolbar -->
        <div class="flex items-center px-4 mb-4">
          <IconField>
            <InputIcon><i class="pi pi-search" /></InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Search collection..." />
          </IconField>
        </div>

        <!-- Mobile Cards -->
        <div class="mobile-cards md:hidden">
          <div v-for="funko in filteredFunkos" :key="funko.id" class="mobile-card">
            <div class="mobile-card-header">
              <img v-if="funko.image" :src="funko.image" :alt="funko.name" class="mobile-card-img" />
              <div>
                <div class="mobile-card-name">{{ funko.name }}</div>
                <div class="mobile-card-sub">{{ funko.title }}</div>
                <div class="mobile-card-sub">{{ funko.series }}</div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-for="sticker in funko.stickers" :key="sticker" class="sticker-badge">{{ sticker }}</span>
                </div>
              </div>
            </div>
            <div class="mobile-card-actions">
              <Button icon="pi pi-eye" outlined rounded severity="info" @click="viewFunko(funko)" />
            </div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="card overflow-x-auto hidden md:block px-4">
          <DataTable
            :value="filteredFunkos"
            dataKey="id"
            :paginator="true"
            :rows="10"
            tableStyle="min-width: 50rem"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25, 50]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Pops"
          >
            <template #empty>No Funko Pops found.</template>
            <Column field="id" header="ID" sortable style="min-width: 8rem" />
            <Column field="name" header="Name" sortable style="min-width: 12rem" />
            <Column field="title" header="Title" sortable style="min-width: 12rem" />
            <Column field="series" header="Series" sortable style="min-width: 12rem" />
            <Column header="Stickers" style="min-width: 12rem">
              <template #body="slotProps">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="sticker in slotProps.data.stickers"
                    :key="sticker"
                    class="sticker-badge"
                  >{{ sticker }}</span>
                </div>
              </template>
            </Column>
            <Column header="Actions" style="min-width: 8rem" :exportable="false">
              <template #body="slotProps">
                <Button icon="pi pi-eye" outlined rounded severity="info" @click="viewFunko(slotProps.data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- View Dialog -->
    <Dialog v-model:visible="showViewDialog" modal header="Funko Pop Details" :style="{ width: '700px', maxWidth: '98vw' }">
      <div v-if="viewedFunko" class="flex flex-col items-center p-8">
        <img v-if="viewedFunko.image" :src="viewedFunko.image" alt="Funko Image"
          class="w-96 h-96 object-cover rounded mb-8 border shadow-lg" />
        <div class="text-3xl font-bold mb-4">{{ viewedFunko.name }}</div>
        <div class="mb-3 text-xl"><span class="font-semibold">Title:</span> {{ viewedFunko.title }}</div>
        <div class="mb-3 text-xl"><span class="font-semibold">Series:</span> {{ viewedFunko.series }}</div>
        <div class="mb-3 text-xl"><span class="font-semibold">ID:</span> {{ viewedFunko.id }}</div>
        <div class="mb-3" v-if="viewedFunko.stickers && viewedFunko.stickers.length > 0">
          <span class="font-semibold text-xl">Stickers:</span>
          <div class="flex flex-wrap gap-2 mt-2 justify-center">
            <span v-for="sticker in viewedFunko.stickers" :key="sticker" class="sticker-badge">{{ sticker }}</span>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.friend-collection-container {
  background: var(--funkollection-background);
  min-height: 100vh;
  padding-bottom: 2rem;
}

.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.mobile-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-card-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
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

.sticker-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--funkollection-secondary);
  color: white;
}
</style>