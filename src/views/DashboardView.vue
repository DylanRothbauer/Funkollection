<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import PopCountCard from '../components/PopCountCard.vue'
import PopCategoryBreakdownCard from '../components/PopCategoryBreakdownCard.vue'
import BadgesCard from '../components/BadgesCard.vue'
import EstimatedValueCard from '../components/EstimatedValueCard.vue'
import PopAcquisitionChart from '../components/PopAcquisitionChart.vue'
const user = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
  })
})
</script>

<template>
  <div>
    <header class="flex items-center justify-between p-4 bg-white shadow-sm rounded-b-lg mb-8">
      <h1 class="text-3xl font-bold text-gray-800">
        Welcome back, {{ user && user.displayName ? user.displayName : 'Signed in User' }}
      </h1>
    </header>
    <div class="flex flex-wrap justify-center gap-8 px-4 py-8 dashboard-cards-container">
      <PopCountCard />
      <PopCategoryBreakdownCard />
      <BadgesCard />
      <PopAcquisitionChart />
      <EstimatedValueCard />
    </div>
  </div>
</template>

<style scoped>
.dashboard-cards-container {
  margin-top: 2rem;
  margin-bottom: 2rem;
}
</style>
