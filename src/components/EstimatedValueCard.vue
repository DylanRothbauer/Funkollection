<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const totalPurchase = computed(() =>
  funkos.value.reduce((sum, pop) => {
    const quantity = Number(pop.quantity) || 1
    const price = Number.parseFloat(pop.purchasePrice)
    return sum + (Number.isNaN(price) ? 0 : price * quantity)
  }, 0),
)

const formattedValue = computed(() =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(totalPurchase.value),
)
</script>

<template>
  <article class="dashboard-card metric-card" aria-labelledby="collection-value-title">
    <div class="metric-icon" aria-hidden="true">
      <span class="pi pi-wallet"></span>
    </div>
    <div>
      <p id="collection-value-title" class="metric-label">Recorded value</p>
      <div v-if="loading" class="metric-skeleton" aria-label="Loading collection value"></div>
      <p v-else class="metric-value">{{ formattedValue }}</p>
      <p class="metric-help">Based on purchase prices you have entered</p>
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
  background: rgba(47, 79, 79, 0.1);
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
  font-size: clamp(2.1rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.05;
}

.metric-help {
  color: #777a72;
  font-size: 0.86rem;
}

.metric-skeleton {
  width: 9rem;
  height: 2.6rem;
  margin: 0.3rem 0;
  border-radius: 8px;
  background: #eceee8;
}
</style>
