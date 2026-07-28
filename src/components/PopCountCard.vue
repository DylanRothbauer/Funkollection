<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const popCount = computed(() => funkos.value.length)
</script>

<template>
  <article class="dashboard-card metric-card" aria-labelledby="collection-size-title">
    <div class="metric-icon" aria-hidden="true">
      <span class="pi pi-box"></span>
    </div>
    <div>
      <p id="collection-size-title" class="metric-label">Collection size</p>
      <div v-if="loading" class="metric-skeleton" aria-label="Loading collection size"></div>
      <p v-else class="metric-value">{{ popCount.toLocaleString() }}</p>
      <p class="metric-help">Pops across your entire collection</p>
    </div>
  </article>
</template>

<style scoped>
.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  display: grid;
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  border-radius: 12px;
  background: rgba(138, 154, 91, 0.14);
  color: var(--funkollection-primary);
  font-size: 1.25rem;
}

.metric-label,
.metric-help,
.metric-value {
  margin: 0;
}

.metric-label {
  color: #696c64;
  font-size: 0.82rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-value {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2.25rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.05;
}

.metric-help {
  color: #777a72;
  font-size: 0.86rem;
}

.metric-skeleton {
  width: 7rem;
  height: 2.6rem;
  margin: 0.3rem 0;
  border-radius: 8px;
  background: #eceee8;
}
</style>
