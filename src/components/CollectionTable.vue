<script setup>
import { onMounted, ref } from 'vue'
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { FilterMatchMode } from '@primevue/core/api'
import { InputText } from 'primevue'
import { IconField } from 'primevue'
import { InputIcon } from 'primevue'
import Button from 'primevue/button'
import AddPopDialog from '@/components/AddPopDialog.vue'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const funkos = ref([])
const user = ref(null)
const selectedFunkos = ref([])
const showAddDialog = ref(false)
const toast = useToast()
const confirm = useConfirm()

async function fetchFunkos() {
  if (!user.value) return
  // 1. Get all Funko IDs from the user's subcollection
  const userFunkosSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
  const funkoIds = userFunkosSnapshot.docs.map((doc) => doc.id)

  // 2. Fetch each FunkoPop's details from the global FunkoPops collection
  const funkoDetails = await Promise.all(
    funkoIds.map(async (id) => {
      const funkoDoc = await getDoc(doc(db, 'FunkoPops', id))
      if (funkoDoc.exists()) {
        const data = funkoDoc.data()
        return {
          id: id || '',
          name: data.name || '',
          title: data.title || '',
          series: data.series || '',
          ...data,
        }
      } else {
        return { id: id || '', name: '', title: '', series: '' }
      }
    }),
  )
  funkos.value = funkoDetails
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      await fetchFunkos()
    }
  })
  loading.value = false
})

function refreshCollection() {
  fetchFunkos()
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
  series: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
const loading = ref(true)
const dt = ref()

onMounted(() => {
  // ...your existing Firestore fetch logic...
  loading.value = false
})

const exportCSV = () => {
  dt.value.exportCSV()
}
const editFunko = (funko) => {
  // Open your edit dialog (implement as needed)
}
async function deleteFunko(funko) {
  if (!user.value) return
  try {
    await deleteDoc(doc(db, 'users', user.value.uid, 'funkos', funko.id))
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Funko Pop deleted!', life: 3000 })
    refreshCollection()
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
    accept: () => deleteFunko(funko),
  })
}
</script>

<template>
  <div>
    <ConfirmDialog />
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
          style="min-width: 14rem"
          :exportable="false"
          :showFilterMenu="false"
        >
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              outlined
              rounded
              class="mr-2"
              @click="editFunko(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              outlined
              rounded
              severity="danger"
              @click="confirmDeleteFunko(slotProps.data)"
            />
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
