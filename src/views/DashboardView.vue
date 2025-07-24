<script setup>
import { useUserFunkos } from '../composables/useUserFunkos'
import PopCountCard from '../components/PopCountCard.vue'
import PopCategoryBreakdownCard from '../components/PopCategoryBreakdownCard.vue'
import BadgesCard from '../components/BadgesCard.vue'
import EstimatedValueCard from '../components/EstimatedValueCard.vue'
import PopAcquisitionChart from '../components/PopAcquisitionChart.vue'

const { user, funkos, loading, error, refresh } = useUserFunkos()
</script>

<template>
  <div>
    <header class="flex items-center justify-between p-4 bg-white shadow-sm rounded-b-lg mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Funko Dashboard</h1>
      <span v-if="user" class="text-lg text-gray-600"
        >Welcome, {{ user.displayName || user.email }}</span
      >
    </header>
    <div class="flex flex-wrap justify-center gap-8 px-4 py-8 dashboard-cards-container">
      <PopCountCard :funkos="funkos" :loading="loading" />
      <PopCategoryBreakdownCard :funkos="funkos" :loading="loading" />
      <BadgesCard :funkos="funkos" :loading="loading" />
      <PopAcquisitionChart :funkos="funkos" :loading="loading" />
      <EstimatedValueCard :funkos="funkos" :loading="loading" />
    </div>
    <div v-if="error" class="text-red-500">Error: {{ error.message }}</div>
  </div>
</template>

<style scoped>
.dashboard-cards-container {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 700px) {
  .dashboard-cards-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
}
</style>
