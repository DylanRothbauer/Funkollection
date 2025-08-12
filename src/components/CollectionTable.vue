<script setup>
import { onMounted, ref } from 'vue'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  deleteField,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { FilterMatchMode } from '@primevue/core/api'
import { InputText } from 'primevue'
import { IconField } from 'primevue'
import { InputIcon } from 'primevue'
import Button from 'primevue/button'
import AddPopDialog from '@/components/AddPopDialog.vue'
import EditPopDialog from '@/components/EditPopDialog.vue'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'

const funkos = ref([])
const user = ref(null)
const selectedFunkos = ref([])
const showAddDialog = ref(false)
const showViewDialog = ref(false)
const showEditDialog = ref(false)
const viewedFunko = ref(null)
const editingFunko = ref(null)
const toast = useToast()
const confirm = useConfirm()
const favorites = ref([])

async function fetchFunkos() {
  if (!user.value) return
  // 1. Get all Funko docs from the user's subcollection (to get image and purchasePrice)
  const userFunkosSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
  const userFunkos = userFunkosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

  // 2. Fetch each FunkoPop's details from the global FunkoPops collection and merge image and purchasePrice from user doc
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
          ...data,
        }
      } else {
        return {
          id: userFunko.id || '',
          name: '',
          title: '',
          series: '',
          image: userFunko.image || '',
          purchasePrice: userFunko.purchasePrice !== undefined ? userFunko.purchasePrice : '',
        }
      }
    }),
  )
  funkos.value = funkoDetails
}

async function fetchFavorites() {
  if (!user.value) return
  const favSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'favorites'))
  favorites.value = favSnapshot.docs.map((doc) => doc.id)
}

async function toggleFavorite(funko) {
  if (!user.value) return
  const favRef = doc(db, 'users', user.value.uid, 'favorites', funko.id)
  if (favorites.value.includes(funko.id)) {
    await deleteDoc(favRef)
    favorites.value = favorites.value.filter((id) => id !== funko.id)
    toast.add({
      severity: 'info',
      summary: 'Removed from Favorites',
      detail: funko.name || funko.title,
      life: 2000,
    })
  } else {
    await setDoc(favRef, { addedAt: new Date().toISOString() })
    favorites.value.push(funko.id)
    toast.add({
      severity: 'success',
      summary: 'Added to Favorites',
      detail: funko.name || funko.title,
      life: 2000,
    })
  }
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      await fetchFunkos()
      await fetchFavorites()
    }
  })
  loading.value = false
})

function isFavorite(funko) {
  return favorites.value.includes(funko.id)
}

onMounted(() => {
  // ...your existing Firestore fetch logic...
  loading.value = false
})

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
  series: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
const loading = ref(true)
const dt = ref()

const exportCSV = () => {
  dt.value.exportCSV()
}
function editFunko(funko) {
  editingFunko.value = funko
  showEditDialog.value = true
}
async function deleteFunko(funko) {
  if (!user.value) return
  try {
    await deleteDoc(doc(db, 'users', user.value.uid, 'funkos', funko.id))
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Funko Pop deleted!', life: 3000 })
    await fetchFunkos() // Ensure table updates after delete
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete Funko Pop.',
      life: 3000,
    })
  }
}

function confirmDeleteFunko(funko) {
  confirm.require({
    message: `Are you sure you want to delete "${funko.name || funko.title || funko.id}" from your collection?`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes',
    rejectLabel: 'No',
    acceptClass: 'p-button-danger',
    rejectClass: '',
    accept: () => deleteFunko(funko),
  })
}

function viewFunko(funko) {
  viewedFunko.value = funko
  showViewDialog.value = true
}

async function refreshCollection() {
  loading.value = true
  try {
    await fetchFunkos()
    await fetchFavorites()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh collection',
      life: 3000,
    })
  }
  loading.value = false
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      await refreshCollection()
    }
  })
})

function handlePopEdited() {
  refreshCollection()
}
</script>

<template>
  <div>
    <ConfirmDialog />
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
        <div class="mb-3 text-xl" v-if="viewedFunko.purchasePrice !== undefined">
          <span class="font-semibold">Purchase Price:</span> ${{
            Number(viewedFunko.purchasePrice).toFixed(2)
          }}
        </div>
      </div>
    </Dialog>
    <EditPopDialog
      v-model:visible="showEditDialog"
      :funko="editingFunko"
      :userId="user && user.uid ? user.uid : ''"
      @pop-edited="handlePopEdited"
    />
    <div class="card">
      <DataTable
        ref="dt"
        v-model:selection="selectedFunkos"
        :value="funkos"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :globalFilterFields="['id', 'name', 'title', 'series']"
        tableStyle="min-width: 50rem"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
      >
        <template #header>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <div class="flex items-center gap-2">
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
              </IconField>
            </div>
            <div class="flex items-center gap-2">
              <Button label="New" icon="pi pi-plus" class="mr-2" @click="showAddDialog = true" />
              <Button
                label="Export"
                icon="pi pi-upload"
                severity="secondary"
                @click="exportCSV($event)"
              />
            </div>
          </div>
        </template>
        <template #empty> No Funko Pops found. </template>
        <template #loading> Loading Funko Pops data. Please wait. </template>

        <Column field="id" header="ID" sortable style="min-width: 10rem"> </Column>
        <Column field="name" header="Name" sortable style="min-width: 12rem"> </Column>
        <Column field="title" header="Title" sortable style="min-width: 12rem"> </Column>
        <Column field="series" header="Series" sortable style="min-width: 12rem"> </Column>
        <Column
          header="Actions"
          style="min-width: 16rem"
          :exportable="false"
          :showFilterMenu="false"
        >
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                icon="pi pi-eye"
                outlined
                rounded
                class="mr-1"
                severity="info"
                @click="viewFunko(slotProps.data)"
              />
              <Button
                icon="pi pi-pencil"
                outlined
                rounded
                class="mr-1"
                @click="editFunko(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                outlined
                rounded
                severity="danger"
                @click="confirmDeleteFunko(slotProps.data)"
              />
              <Button
                :icon="isFavorite(slotProps.data) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                rounded
                outlined
                severity="help"
                class="mr-1"
                @click="toggleFavorite(slotProps.data)"
                :aria-label="
                  isFavorite(slotProps.data) ? 'Remove from Favorites' : 'Add to Favorites'
                "
              />
            </div>
          </template>
        </Column>
      </DataTable>
      <AddPopDialog v-model:visible="showAddDialog" @pop-added="refreshCollection" />
    </div>
  </div>
</template>

<style>
.p-datatable-header-cell {
  background-color: var(--funkollection-secondary) !important;
  color: var(--funkollection-soft-white) !important;
}

.p-datatable-header {
  background: var(--funkollection-background) !important;
}

.p-toolbar {
  background: var(--funkollection-background) !important;
}
</style>
