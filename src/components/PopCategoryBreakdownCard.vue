<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import Chart from 'primevue/chart'

const chartData = ref({ labels: [], datasets: [] })
const chartOptions = ref({
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  responsive: true,
  maintainAspectRatio: false,
})
const loading = ref(true)

onMounted(() => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userFunkosSnapshot = await getDocs(collection(db, 'users', firebaseUser.uid, 'funkos'))
      const popIds = []
      userFunkosSnapshot.forEach((docSnap) => {
        popIds.push(docSnap.id)
      })
      const categoryCount = {}
      for (const popId of popIds) {
        const popDoc = await getDocs(collection(db, 'FunkoPops'))
        // Find the pop with the matching id
        const popData = popDoc.docs.find((doc) => doc.id === popId)?.data()
        const series =
          popData && popData.series && popData.series.trim() ? popData.series.trim() : 'No Series'
        categoryCount[series] = (categoryCount[series] || 0) + 1
      }
      // Sort by count descending, show top 6, group rest as 'Other'
      const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])
      const top = sorted.slice(0, 6)
      const otherCount = sorted.slice(6).reduce((sum, [, count]) => sum + count, 0)
      const labels = top.map(([category]) => category)
      if (otherCount > 0) labels.push('Other')
      const data = top.map(([, count]) => count)
      if (otherCount > 0) data.push(otherCount)
      chartData.value = {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              '#7c3aed',
              '#f59e42',
              '#10b981',
              '#f43f5e',
              '#6366f1',
              '#fbbf24',
              '#a3a3a3',
            ],
            borderWidth: 0,
          },
        ],
      }
    }
    loading.value = false
  })
})
</script>

<template>
  <div
    class="pop-category-card shadow rounded-lg bg-white flex flex-col items-center justify-center py-8 px-6"
    style="min-width: 320px; min-height: 340px"
  >
    <div class="text-lg font-semibold text-gray-400 mb-4" style="letter-spacing: 0.03em">
      Top Categories
    </div>
    <div v-if="loading" class="text-2xl text-gray-400">...</div>
    <Chart
      v-else
      type="doughnut"
      :data="chartData"
      :options="chartOptions"
      style="width: 220px; height: 220px"
    />
    <div v-if="!loading" class="mt-4 w-full flex flex-col items-center">
      <div
        v-for="(label, i) in chartData.labels"
        :key="label"
        class="flex items-center gap-2 mb-1 text-sm"
      >
        <span
          :style="{
            background: chartData.datasets[0].backgroundColor[i],
            width: '14px',
            height: '14px',
            display: 'inline-block',
            borderRadius: '3px',
          }"
        ></span>
        <span>{{ label }}</span>
        <span class="ml-2 font-bold">{{ chartData.datasets[0].data[i] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pop-category-card {
  transition: box-shadow 0.2s;
}
.pop-category-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
</style>
