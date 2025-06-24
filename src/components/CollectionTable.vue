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

const funkos = ref([])
const user = ref(null)
const selectedFunkos = ref([])

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
          return funkoDoc.exists() ? { id, ...funkoDoc.data() } : { id }
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
      <Toolbar class="mb-6">
        <template #start>
          <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="confirmDeleteSelected"
            :disabled="!selectedFunkos || !selectedFunkos.length"
          />
        </template>
        <template #end>
          <Button
            label="Export"
            icon="pi pi-upload"
            severity="secondary"
            @click="exportCSV($event)"
          />
        </template>
      </Toolbar>

      <DataTable
        ref="dt"
        v-model:selection="selectedFunkos"
        :value="funkos"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        filterDisplay="row"
        :globalFilterFields="['id', 'name', 'title', 'series']"
        tableStyle="min-width: 50rem"
      >
        <template #header>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <h4 class="m-0">My Funko Pops</h4>
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Search..." />
            </IconField>
          </div>
        </template>
        <template #empty> No Funko Pops found. </template>
        <template #loading> Loading Funko Pops data. Please wait. </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="id" header="ID" sortable style="min-width: 10rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder="Search by ID"
            />
          </template>
        </Column>
        <Column field="name" header="Name" sortable style="min-width: 12rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder="Search by name"
            />
          </template>
        </Column>
        <Column field="title" header="Title" sortable style="min-width: 12rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder="Search by title"
            />
          </template>
        </Column>
        <Column field="series" header="Series" sortable style="min-width: 12rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder="Search by series"
            />
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 8rem">
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
    </div>
    <!-- Dialogs for add/edit/delete can be added here -->
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
</style>
