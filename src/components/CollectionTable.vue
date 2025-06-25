<script setup>
import { onMounted, ref } from 'vue'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { FilterMatchMode } from '@primevue/core/api'
import { InputText } from 'primevue'
import { IconField } from 'primevue'
import { InputIcon } from 'primevue'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import AddPopDialog from '@/components/AddPopDialog.vue'

const funkos = ref([])
const user = ref(null)
const selectedFunkos = ref([])
const showAddDialog = ref(false)

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
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
  })
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

onMounted(() => {
  // ...your existing Firestore fetch logic...
  loading.value = false
})

const exportCSV = () => {
  dt.value.exportCSV()
}
const openNew = () => {
  // Open your add dialog (implement as needed)
}
const editFunko = (funko) => {
  // Open your edit dialog (implement as needed)
}
const confirmDeleteFunko = (funko) => {
  // Open your delete dialog (implement as needed)
}
const confirmDeleteSelected = () => {
  // Open your bulk delete dialog (implement as needed)
}
</script>

<template>
  <div>
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
