<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

// Use shared reactive funkos and loading state
const { funkos, loading } = useUserFunkos()

const totalPurchase = computed(() => {
  if (!funkos.value || funkos.value.length === 0) return 0

  return funkos.value.reduce((sum, pop) => {
    const qty = pop.quantity || 1
    const price = parseFloat(pop.purchasePrice)
    return sum + (isNaN(price) ? 0 : price * qty)
  }, 0)
})
</script>

<template>
  <div class="dashboard-card flex flex-col items-center justify-center">
    <div class="font-semibold text-lg text-gray-500 mb-2">Collection Value</div>

    <div v-if="loading.value" class="text-gray-400 text-xl">Loading...</div>

    <div v-else class="w-full flex flex-col items-center gap-2">
      <div class="text-6xl font-extrabold mb-2" style="color: var(--funkollection-secondary)">
        ${{ totalPurchase.toFixed(2) }}
      </div>
      <div class="text-lg text-gray-600">Total purchase price of your collection</div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #ececec;
  margin-bottom: 1.5rem;
  min-width: 320px;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.dashboard-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.02);
}
</style>
