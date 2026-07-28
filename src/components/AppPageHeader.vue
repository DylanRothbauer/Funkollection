<script setup>
defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '' },
})
</script>

<template>
  <header class="app-page-header">
    <div class="header-copy">
      <p class="page-eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p class="page-description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
    <span v-else-if="icon" :class="['pi', icon, 'header-icon']" aria-hidden="true"></span>
  </header>
</template>

<style scoped>
.app-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.page-eyebrow {
  margin: 0 0 0.4rem;
  color: var(--funkollection-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.08;
}

.page-description {
  max-width: 46rem;
  margin: 0.75rem 0 0;
  color: #5f625b;
  font-size: clamp(0.95rem, 1.5vw, 1.08rem);
}

.header-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
}

.header-icon {
  color: var(--funkollection-secondary);
  font-size: clamp(2rem, 5vw, 3.5rem);
}

@media (max-width: 768px) {
  .app-page-header {
    align-items: stretch;
    flex-direction: column;
    gap: 1.25rem;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions :deep(*) {
    flex: 1 1 auto;
  }

  .header-icon {
    display: none;
  }
}
</style>
