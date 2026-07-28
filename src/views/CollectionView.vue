<script setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import CollectionTable from '@/components/CollectionTable.vue'
import AppPageHeader from '@/components/AppPageHeader.vue'
import { useUserFunkos } from '@/composables/useUserFunkos'

const collectionTable = ref(null)
const { funkos, loading } = useUserFunkos()
const collectionCount = computed(() => funkos.value.length)
</script>

<template>
  <main class="feature-page">
    <AppPageHeader
      eyebrow="Your library"
      title="My collection"
      description="Search, organize, and manage every Pop you own from one focused workspace."
    >
      <template #actions>
        <div class="collection-total" aria-live="polite">
          <span>{{ loading ? '—' : collectionCount.toLocaleString() }}</span>
          <small>{{ collectionCount === 1 ? 'Pop' : 'Pops' }} collected</small>
        </div>
        <Button label="Add Funko" icon="pi pi-plus" @click="collectionTable?.openAddDialog()" />
      </template>
    </AppPageHeader>
    <CollectionTable ref="collectionTable" />
  </main>
</template>

<style scoped>
.feature-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.feature-page > * {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.feature-page > :last-child {
  margin-top: 1rem;
}

.collection-total {
  display: flex;
  min-width: 7rem;
  flex-direction: column;
  justify-content: center;
  padding-right: 1rem;
  border-right: 1px solid rgba(47, 79, 79, 0.12);
  color: var(--funkollection-primary);
  text-align: right;
}

.collection-total span {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 750;
  line-height: 1;
}

.collection-total small {
  margin-top: 0.2rem;
  color: #73776e;
  font-size: 0.72rem;
}

@media (max-width: 768px) {
  .feature-page {
    padding: 1rem;
  }

  .collection-total {
    flex: 1 1 100%;
    align-items: flex-start;
    padding-right: 0;
    padding-bottom: 0.75rem;
    border-right: 0;
    border-bottom: 1px solid rgba(47, 79, 79, 0.12);
    text-align: left;
  }
}
</style>
