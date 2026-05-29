<script setup>
import { onMounted, ref, computed } from 'vue'
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
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
import * as XLSX from 'xlsx'
import { useUserFunkos } from '../composables/useUserFunkos'

// Use composable as single source of truth for funkos
const { addFunkoPop, funkos, loading, refresh } = useUserFunkos()

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
const importInput = ref(null)
const importResults = ref(null)
const showImportResults = ref(false)
const isImporting = ref(false)

async function fetchFavorites() {
  if (!user.value) return
  const favSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'favorites'))
  favorites.value = favSnapshot.docs.map((doc) => doc.id)
}

async function toggleFavorite(funko) {
  if (!user.value) return
  // Favorites use funko.id (the funko number) as the key
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

const filteredFunkos = computed(() => {
  const search = filters.value.global.value?.toLowerCase() || ''
  if (!search) return funkos.value
  return funkos.value.filter(f =>
    [f.name, f.title, f.series, f.id].some(v => v?.toLowerCase().includes(search))
  )
})

function triggerImport() {
  importInput.value.click()
}

async function handleImportCSV(event) {
  const file = event.target.files[0]
  if (!file || !user.value) return

  isImporting.value = true

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  let imported = 0
  let errors = 0

  await Promise.all(rows.map(async (row) => {
    const id = String(row['id'] || row['ID'] || '').trim()
    if (!id) { errors++; return }

    try {
      await addFunkoPop({
        id,
        name: String(row['name'] || row['Name'] || '').trim(),
        title: String(row['title'] || row['Title'] || '').trim(),
        series: String(row['series'] || row['Series'] || '').trim(),
        image: String(row['image url'] || row['Image URL'] || '').trim(),
        purchasePrice: parseFloat(row['purchase price'] || row['Purchase Price'] || 0) || 0,
      })
      imported++
    } catch (e) {
      console.error('Import error on row:', row, e)
      errors++
    }
  }))

  await refresh()
  isImporting.value = false
  importInput.value.value = ''
  importResults.value = { imported, errors }
  showImportResults.value = true

  toast.add({
    severity: 'success',
    summary: 'Import Complete',
    detail: `${imported} added, ${errors} errors`,
    life: 4000
  })
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      await fetchFavorites()
    }
  })
})

function isFavorite(funko) {
  return favorites.value.includes(funko.id)
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
  series: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
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
    // Use docId (auto-generated key) not funko.id (funko number)
    await deleteDoc(doc(db, 'users', user.value.uid, 'funkos', funko.docId))
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Funko Pop deleted!', life: 3000 })
    await refresh()
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
    accept: () => deleteFunko(funko),
  })
}

function viewFunko(funko) {
  viewedFunko.value = funko
  showViewDialog.value = true
}

function handlePopEdited() {
  refreshCollection()
}

const refreshCollection = async () => {
  await refresh()
  await fetchFavorites()
}
</script>

<template>
  <div>
    <ConfirmDialog />
    <AddPopDialog v-model:visible="showAddDialog" @pop-added="refreshCollection" />
    <Dialog
      v-model:visible="showViewDialog"
      modal
      header="Funko Pop Details"
      :style="{ width: '700px', maxWidth: '98vw' }"
    >
      <div v-if="viewedFunko" class="flex flex-col items-center p-6 gap-4">
        <!-- Image -->
        <img
          v-if="viewedFunko.image"
          :src="viewedFunko.image"
          alt="Funko Image"
          class="w-64 h-64 object-cover rounded-xl border shadow-lg mb-2"
        />

        <!-- Name -->
        <div class="text-2xl font-bold text-center" style="font-family: 'Playfair Display', serif; color: var(--funkollection-primary)">
          {{ viewedFunko.name }}
        </div>

        <!-- Details Table -->
        <div class="w-full max-w-sm flex flex-col gap-0 rounded-xl overflow-hidden border" style="border-color: rgba(44,74,46,0.15)">
          <div class="detail-row">
            <span class="detail-label">Title</span>
            <span class="detail-value">{{ viewedFunko.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Series</span>
            <span class="detail-value">{{ viewedFunko.series }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ viewedFunko.id || '—' }}</span>
          </div>
          <div class="detail-row" v-if="viewedFunko.quantity && viewedFunko.quantity > 1">
            <span class="detail-label">Quantity</span>
            <span class="detail-value">{{ viewedFunko.quantity }}</span>
          </div>
          <div class="detail-row" v-if="viewedFunko.purchasePrice !== undefined">
            <span class="detail-label">Purchase Price</span>
            <span class="detail-value">${{ Number(viewedFunko.purchasePrice).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Stickers -->
        <div v-if="viewedFunko.stickers && viewedFunko.stickers.length > 0" class="w-full max-w-sm">
          <div class="detail-label mb-2" style="font-size: 0.8rem;">Stickers / Exclusives</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="sticker in viewedFunko.stickers"
              :key="sticker"
              class="sticker-badge"
            >
              {{ sticker }}
            </span>
          </div>
        </div>
      </div>
    </Dialog>
    <EditPopDialog
      v-model:visible="showEditDialog"
      :funko="editingFunko"
      :userId="user && user.uid ? user.uid : ''"
      @pop-edited="handlePopEdited"
    />

    <!-- Shared toolbar - always visible -->
    <div class="flex flex-wrap gap-2 items-center justify-between p-4">
      <IconField>
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText v-model="filters['global'].value" placeholder="Search..." />
      </IconField>
      <div class="flex gap-2">
        <Button label="New" icon="pi pi-plus" @click="showAddDialog = true" />
        <Button label="Import" icon="pi pi-download" severity="secondary" @click="triggerImport" />
        <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
        <input ref="importInput" type="file" accept=".csv" style="display:none" @change="handleImportCSV" />
      </div>
    </div>
    <!-- Mobile Card View (visible on small screens only) -->
    <div class="mobile-cards md:hidden">
      <div v-for="funko in filteredFunkos" :key="funko.id" class="mobile-card">
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
          <Button icon="pi pi-pencil" outlined rounded @click="editFunko(funko)" />
          <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteFunko(funko)" />
          <Button
            :icon="isFavorite(funko) ? 'pi pi-heart-fill' : 'pi pi-heart'"
            outlined rounded severity="help"
            @click="toggleFavorite(funko)"
          />
        </div>
      </div>
    </div>
    <div class="card overflow-x-auto hidden md:block">
      <DataTable
        ref="dt"
        v-model:selection="selectedFunkos"
        :value="filteredFunkos"
        dataKey="docId"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :globalFilterFields="['id', 'name', 'title', 'series']"
        tableStyle="min-width: 50rem"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
      >
        <!-- <template #header>
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
        </template> -->
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
      <Dialog v-model:visible="showImportResults" modal header="Import Results" :style="{ width: '400px' }">
        <div v-if="importResults" class="flex flex-col gap-3 p-4 text-center">
          <div class="text-green-600 text-xl font-bold">✓ {{ importResults.imported }} Pops added</div>
          <div class="text-blue-600 text-xl">↑ {{ importResults.updated }} quantities updated</div>
          <div class="text-red-600 text-xl" v-if="importResults.errors > 0">✗ {{ importResults.errors }} errors</div>
        </div>
      </Dialog>

      <Dialog v-model:visible="isImporting" modal header="Importing..." :closable="false" :style="{ width: '300px' }">
        <div class="flex flex-col items-center gap-3 py-4">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--funkollection-secondary)"></i>
          <p class="text-center">Importing your collection, please wait...</p>
        </div>
      </Dialog>

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

.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .mobile-cards {
    display: none !important;
  }
}

.mobile-card {
  background: var(--funkollection-background);
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

.sticker-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--funkollection-secondary);
  color: white;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(44,74,46,0.08);
  background: white;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row:nth-child(even) {
  background: var(--funkollection-background);
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--funkollection-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.95rem;
  color: var(--funkollection-text);
  font-weight: 500;
  text-align: right;
}

</style>
