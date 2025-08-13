<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '@/composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

// Sort by purchasePrice, highest first, and get top 3
const mostValuableFunkos = computed(() => {
  return [...funkos.value]
    .filter((f) => typeof f.purchasePrice === 'number')
    .sort((a, b) => b.purchasePrice - a.purchasePrice)
    .slice(0, 3)
})
</script>

<template>
  <div class="pop-card">
    <h2 class="font-semibold text-lg text-gray-500 mb-4">Most Valuable Pops</h2>

    <div v-if="loading" class="text-gray-400 text-sm">Loading...</div>

    <div v-else-if="mostValuableFunkos.length === 0" class="text-gray-400 text-sm">
      No value data available yet.
    </div>

    <ul v-else class="flex flex-col gap-3">
      <li v-for="funko in mostValuableFunkos" :key="funko.id" class="flex items-center gap-3">
        <img
          :src="funko.image || '/placeholder.png'"
          alt="Funko"
          class="w-12 h-12 object-cover rounded border"
        />
        <div class="flex flex-col">
          <div class="font-medium text-gray-800">
            {{ funko.name || 'Unnamed Pop' }}
          </div>
          <div class="text-sm text-gray-500">${{ funko.purchasePrice?.toFixed(2) || '0.00' }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
