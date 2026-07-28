<script setup>
import CollectionTable from '@/components/CollectionTable.vue'
import AppPageHeader from '@/components/AppPageHeader.vue'
</script>

<template>
  <main class="feature-page">
    <AppPageHeader
      eyebrow="Your library"
      title="My collection"
      description="Search, organize, and manage every Pop you own from one focused workspace."
      icon="pi-box"
    />
    <CollectionTable />
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

@media (max-width: 768px) {
  .feature-page {
    padding: 1rem;
  }
}
</style>
