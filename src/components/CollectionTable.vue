<script setup>
import { onMounted, ref, computed } from 'vue'
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore'
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
import * as XLSX from 'xlsx'
import { useUserFunkos } from '../composables/useUserFunkos'
import PopDetailsDialog from '@/components/PopDetailsDialog.vue'

// Use composable as single source of truth for funkos
const { addFunkoPop, funkos, loading, error, refresh } = useUserFunkos()

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
  // Favorites use funko.docId (the user's funko document ID) as the key
  const favRef = doc(db, 'users', user.value.uid, 'favorites', funko.docId)
  if (favorites.value.includes(funko.docId)) {
    await deleteDoc(favRef)
    favorites.value = favorites.value.filter((id) => id !== funko.docId)
    toast.add({
      severity: 'info',
      summary: 'Removed from Favorites',
      detail: funko.name || funko.title,
      life: 2000,
    })
  } else {
    await setDoc(favRef, {
      addedAt: new Date().toISOString(),
      funkoDocId: funko.docId,
      funkoId: funko.id,
    })
    favorites.value.push(funko.docId)
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
  return funkos.value.filter((f) =>
    [f.name, f.title, f.series, f.id].some((v) => v?.toLowerCase().includes(search)),
  )
})

const hasSearch = computed(() => Boolean(filters.value.global.value?.trim()))

function clearSearch() {
  filters.value.global.value = null
}

function openAddDialog() {
  showAddDialog.value = true
}

defineExpose({ openAddDialog })

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

  await Promise.all(
    rows.map(async (row) => {
      const id = String(row['id'] || row['ID'] || '').trim()
      if (!id) {
        errors++
        return
      }

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
    }),
  )

  await refresh()
  isImporting.value = false
  importInput.value.value = ''
  importResults.value = { imported, errors }
  showImportResults.value = true

  toast.add({
    severity: 'success',
    summary: 'Import Complete',
    detail: `${imported} added, ${errors} errors`,
    life: 4000,
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
  return favorites.value.includes(funko.docId)
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
  <section class="collection-workspace" aria-label="Collection manager">
    <ConfirmDialog />
    <AddPopDialog v-model:visible="showAddDialog" @pop-added="refreshCollection" />
    <PopDetailsDialog v-model:visible="showViewDialog" :funko="viewedFunko" />
    <EditPopDialog
      v-model:visible="showEditDialog"
      :funko="editingFunko"
      :userId="user && user.uid ? user.uid : ''"
      @pop-edited="handlePopEdited"
    />

    <!-- Shared toolbar - always visible -->
    <div class="collection-toolbar">
      <div class="search-group">
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            v-model="filters['global'].value"
            aria-label="Search your collection"
            placeholder="Search name, title, series, or ID"
          />
        </IconField>
        <button v-if="hasSearch" type="button" class="clear-search" @click="clearSearch">
          Clear search
        </button>
      </div>
      <div class="toolbar-actions">
        <Button label="Import" icon="pi pi-download" severity="secondary" @click="triggerImport" />
        <Button
          label="Export"
          icon="pi pi-upload"
          severity="secondary"
          @click="exportCSV($event)"
        />
        <input
          ref="importInput"
          type="file"
          accept=".csv"
          class="sr-only"
          @change="handleImportCSV"
        />
      </div>
    </div>
    <div class="results-summary" aria-live="polite">
      <strong>{{ filteredFunkos.length }}</strong>
      {{ filteredFunkos.length === 1 ? 'Pop' : 'Pops' }}
      <span v-if="hasSearch">matching “{{ filters.global.value }}”</span>
      <span v-else>in your collection</span>
    </div>
    <div v-if="error" class="collection-error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      <div>
        <h2>We couldn’t load your collection</h2>
        <p>Please check your connection and try again.</p>
      </div>
      <Button label="Try again" icon="pi pi-refresh" outlined @click="refresh" />
    </div>
    <div v-else-if="loading" class="table-skeleton" aria-live="polite">
      <p class="sr-only">Loading your collection</p>
      <div class="skeleton-header"></div>
      <div v-for="index in 6" :key="index" class="skeleton-row">
        <span class="skeleton-image"></span>
        <span></span>
        <span></span>
        <span></span>
        <span class="skeleton-actions"></span>
      </div>
    </div>
    <div v-else-if="filteredFunkos.length === 0" class="collection-empty">
      <i :class="['pi', hasSearch ? 'pi-search' : 'pi-box']" aria-hidden="true"></i>
      <h2>{{ hasSearch ? 'No matching Pops' : 'Your collection is ready to grow' }}</h2>
      <p>
        {{
          hasSearch
            ? 'Try a different name, title, series, or ID.'
            : 'Add your first Funko Pop to start organizing your collection.'
        }}
      </p>
      <Button
        v-if="!hasSearch"
        label="Add your first Funko"
        icon="pi pi-plus"
        @click="showAddDialog = true"
      />
      <button v-else type="button" class="clear-search" @click="clearSearch">Reset search</button>
    </div>
    <div v-else class="mobile-cards md:hidden">
      <article v-for="funko in filteredFunkos" :key="funko.docId" class="mobile-card">
        <div class="mobile-card-content">
          <div class="mobile-image-wrap">
            <img
              :src="funko.image || '/placeholder.svg'"
              :alt="funko.name ? `${funko.name} collectible` : 'Funko Pop collectible'"
              class="mobile-card-img"
            />
          </div>
          <div class="mobile-card-copy">
            <div class="mobile-card-topline">
              <span class="mobile-card-id">#{{ funko.id || '—' }}</span>
              <span v-if="isFavorite(funko)" class="favorite-status">
                <i class="pi pi-heart-fill" aria-hidden="true"></i>
                Favorite
              </span>
            </div>
            <h2 class="mobile-card-name">{{ funko.name || 'Unnamed Pop' }}</h2>
            <p class="mobile-card-sub">{{ funko.title || 'No title recorded' }}</p>
            <p class="mobile-card-series">
              <i class="pi pi-tag" aria-hidden="true"></i>
              {{ funko.series || 'Series not recorded' }}
            </p>
          </div>
        </div>
        <div class="mobile-card-actions">
          <Button label="View details" icon="pi pi-eye" outlined @click="viewFunko(funko)" />
          <Button icon="pi pi-pencil" text aria-label="Edit Pop" @click="editFunko(funko)" />
          <Button
            :icon="isFavorite(funko) ? 'pi pi-heart-fill' : 'pi pi-heart'"
            text
            severity="help"
            :aria-pressed="isFavorite(funko)"
            :aria-label="isFavorite(funko) ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite(funko)"
          />
          <Button
            icon="pi pi-trash"
            text
            severity="danger"
            aria-label="Delete Pop"
            @click="confirmDeleteFunko(funko)"
          />
        </div>
      </article>
    </div>
    <div v-if="!loading && filteredFunkos.length > 0" class="table-card hidden md:block">
      <DataTable
        ref="dt"
        v-model:selection="selectedFunkos"
        :value="filteredFunkos"
        :loading="loading"
        dataKey="docId"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :globalFilterFields="['id', 'name', 'title', 'series']"
        tableStyle="min-width: 62rem"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Pops"
      >
        <template #empty> No Funko Pops found. </template>
        <template #loading> Loading Funko Pops data. Please wait. </template>

        <Column field="name" header="Pop" sortable style="min-width: 17rem">
          <template #body="slotProps">
            <div class="pop-cell">
              <img
                :src="slotProps.data.image || '/placeholder.svg'"
                :alt="slotProps.data.name ? `${slotProps.data.name} collectible` : ''"
              />
              <div>
                <strong>{{ slotProps.data.name || 'Unnamed Pop' }}</strong>
                <span>{{ slotProps.data.title || 'No title recorded' }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column field="id" header="Number" sortable style="min-width: 8rem">
          <template #body="slotProps">
            <span class="pop-number">#{{ slotProps.data.id || '—' }}</span>
          </template>
        </Column>
        <Column field="title" header="Title" sortable style="min-width: 12rem"></Column>
        <Column field="series" header="Series" sortable style="min-width: 12rem"></Column>
        <Column
          header="Actions"
          style="min-width: 13rem"
          :exportable="false"
          :showFilterMenu="false"
        >
          <template #body="slotProps">
            <div class="row-actions">
              <Button
                :icon="isFavorite(slotProps.data) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                text
                severity="help"
                :aria-pressed="isFavorite(slotProps.data)"
                @click="toggleFavorite(slotProps.data)"
                :aria-label="
                  isFavorite(slotProps.data) ? 'Remove from Favorites' : 'Add to Favorites'
                "
              />
              <Button
                icon="pi pi-eye"
                text
                aria-label="View Pop details"
                @click="viewFunko(slotProps.data)"
              />
              <Button
                icon="pi pi-pencil"
                text
                aria-label="Edit Pop"
                @click="editFunko(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                aria-label="Delete Pop"
                @click="confirmDeleteFunko(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
      <Dialog
        v-model:visible="showImportResults"
        modal
        header="Import results"
        :style="{ width: 'min(25rem, calc(100vw - 2rem))' }"
      >
        <div v-if="importResults" class="import-results">
          <div class="import-result import-result--success">
            <i class="pi pi-check-circle" aria-hidden="true"></i>
            <span
              ><strong>{{ importResults.imported }}</strong> Pops added</span
            >
          </div>
          <div v-if="importResults.errors > 0" class="import-result import-result--error">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <span
              ><strong>{{ importResults.errors }}</strong> rows could not be imported</span
            >
          </div>
        </div>
      </Dialog>

      <Dialog
        v-model:visible="isImporting"
        modal
        header="Importing collection"
        :closable="false"
        :style="{ width: 'min(20rem, calc(100vw - 2rem))' }"
      >
        <div class="importing-state" aria-live="polite">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>Adding your Pops. Please keep this window open.</p>
        </div>
      </Dialog>
    </div>
  </section>
</template>

<style scoped>
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

.mobile-card-content {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  align-items: start;
  gap: 0.9rem;
}

.mobile-image-wrap {
  display: grid;
  width: 5rem;
  height: 5rem;
  place-items: center;
  border-radius: 10px;
  background: #f6f3e8;
}

.mobile-card-copy {
  min-width: 0;
}

.mobile-card-topline {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.mobile-card-id {
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.favorite-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #8b423e;
  font-size: 0.68rem;
  font-weight: 800;
}

.mobile-card-name {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.15rem;
  line-height: 1.2;
}

.mobile-card-sub,
.mobile-card-series {
  overflow: hidden;
  margin: 0.25rem 0 0;
  color: #74786e;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-card-series {
  color: #5f655c;
}

.collection-workspace {
  overflow: hidden;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.collection-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid rgba(47, 79, 79, 0.1);
}

.search-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.search-group :deep(.p-iconfield),
.search-group :deep(.p-inputtext) {
  width: min(30rem, 100%);
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.clear-search {
  min-height: 40px;
  padding: 0.45rem 0.7rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--funkollection-primary);
  font-weight: 700;
  cursor: pointer;
}

.clear-search:hover {
  background: rgba(138, 154, 91, 0.1);
}

.clear-search:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.3);
  outline-offset: 2px;
}

.results-summary {
  padding: 0.75rem 1.25rem;
  background: rgba(138, 154, 91, 0.07);
  color: #696d64;
  font-size: 0.88rem;
}

.results-summary strong {
  color: var(--funkollection-primary);
}

.table-card {
  overflow-x: auto;
}

.pop-cell {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
}

.pop-cell img {
  width: 3.5rem;
  height: 3.5rem;
  border: 1px solid rgba(47, 79, 79, 0.1);
  border-radius: 8px;
  background: #f6f3e8;
  object-fit: contain;
}

.pop-cell > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.pop-cell strong,
.pop-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pop-cell strong {
  color: var(--funkollection-primary);
}

.pop-cell span {
  color: #74786e;
  font-size: 0.78rem;
}

.pop-number {
  color: var(--funkollection-primary);
  font-variant-numeric: tabular-nums;
  font-weight: 750;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.collection-workspace :deep(.p-datatable-header-cell) {
  border-color: rgba(47, 79, 79, 0.12) !important;
  background: #f4f3eb !important;
  color: var(--funkollection-primary) !important;
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.collection-workspace :deep(.p-datatable-tbody > tr > td) {
  border-color: rgba(47, 79, 79, 0.09);
}

.collection-workspace :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(138, 154, 91, 0.07);
}

.collection-workspace :deep(.p-paginator) {
  border-top: 1px solid rgba(47, 79, 79, 0.1);
  background: white;
}

.collection-empty {
  display: grid;
  min-height: 18rem;
  padding: 2rem;
  place-items: center;
  align-content: center;
  color: #6e7269;
  text-align: center;
}

.collection-empty > .pi {
  color: var(--funkollection-secondary);
  font-size: 1.6rem;
}

.collection-empty h2 {
  margin: 0.75rem 0 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.4rem;
}

.collection-empty p {
  max-width: 30rem;
  margin: 0.35rem 0 1rem;
}

.mobile-card {
  border: 1px solid rgba(47, 79, 79, 0.12);
  background: white;
  box-shadow: none;
}

.collection-error {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  min-height: 9rem;
  padding: 1.5rem;
  color: #73382d;
}

.collection-error > .pi {
  font-size: 1.5rem;
}

.collection-error h2,
.collection-error p {
  margin: 0;
}

.collection-error h2 {
  color: #73382d;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.3rem;
}

.collection-error p {
  margin-top: 0.2rem;
  color: #83594f;
}

.table-skeleton {
  padding: 1rem 1.25rem 1.5rem;
}

.skeleton-header,
.skeleton-row span {
  border-radius: 7px;
  background: #eceee8;
}

.skeleton-header {
  height: 2.75rem;
  margin-bottom: 0.5rem;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 3.5rem 1.5fr 0.7fr 1fr 8rem;
  align-items: center;
  gap: 1rem;
  min-height: 4.5rem;
  border-bottom: 1px solid rgba(47, 79, 79, 0.08);
}

.skeleton-row span {
  height: 0.8rem;
}

.skeleton-row .skeleton-image {
  height: 3rem;
}

.skeleton-row .skeleton-actions {
  height: 2rem;
}

.import-results {
  display: grid;
  gap: 0.75rem;
}

.import-result {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem;
  border-radius: 8px;
}

.import-result--success {
  background: rgba(138, 154, 91, 0.12);
  color: var(--funkollection-primary);
}

.import-result--error {
  background: #fff2ef;
  color: #7a3526;
}

.importing-state {
  display: grid;
  padding: 1rem;
  place-items: center;
  color: #656961;
  text-align: center;
}

.importing-state .pi {
  color: var(--funkollection-secondary);
  font-size: 1.75rem;
}

.mobile-card-actions {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(47, 79, 79, 0.09);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 768px) {
  .collection-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 1rem;
  }

  .search-group {
    align-items: stretch;
    flex-direction: column;
  }

  .search-group :deep(.p-iconfield),
  .search-group :deep(.p-inputtext) {
    width: 100%;
  }

  .toolbar-actions :deep(.p-button) {
    flex: 1 1 auto;
  }

  .mobile-cards {
    padding: 1rem;
  }

  .collection-error {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .table-skeleton {
    padding: 1rem;
  }

  .skeleton-row {
    grid-template-columns: 3.5rem minmax(0, 1fr);
  }

  .skeleton-row span:nth-child(n + 3) {
    display: none;
  }
}
</style>
