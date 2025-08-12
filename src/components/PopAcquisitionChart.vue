<script setup>
import { ref, watch, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { useUserFunkos } from '../composables/useUserFunkos'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

const { funkos, loading } = useUserFunkos()
const hasFunkos = computed(() => funkos.value && funkos.value.length > 0)

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

function parseAddedAt(addedAt) {
  if (!addedAt) return null
  if (typeof addedAt === 'object' && typeof addedAt.toDate === 'function') {
    return addedAt.toDate()
  }
  const date = new Date(addedAt)
  return isNaN(date.getTime()) ? null : date
}

const yearsAvailable = computed(() => {
  const set = new Set()
  funkos.value?.forEach((pop) => {
    const date = parseAddedAt(pop.addedAt)
    if (date) set.add(date.getFullYear())
  })
  const sorted = Array.from(set).sort((a, b) => b - a)
  return sorted.length > 0 ? sorted : [currentYear]
})

const chartData = ref({ labels: [], datasets: [] })

function groupByMonth(pops, year) {
  const months = Array(12).fill(0)
  pops?.forEach((pop) => {
    const date = parseAddedAt(pop.addedAt)

    // DEBUGGING
    if (!date) {
      console.warn('[AcquisitionTimeline] Skipped pop with invalid addedAt:', pop)
      return
    }

    if (date.getFullYear() === year) {
      months[date.getMonth()]++
    }
  })
  return months
}

function updateChart() {
  const months = groupByMonth(funkos.value, selectedYear.value)
  chartData.value = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: `Pops Acquired in ${selectedYear.value}`,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.15)',
        borderWidth: 3,
        pointBackgroundColor: '#2563eb',
        pointRadius: 5,
        fill: false,
        tension: 0.3,
        data: months,
      },
    ],
  }
}

watch([funkos, selectedYear], updateChart, { immediate: true })
watch(funkos, (newFunkos) => {
  console.log('[AcquisitionTimeline] Funkos loaded:', newFunkos)
})
const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        stepSize: 1,
        callback: (value) => Number(value).toFixed(0),
      },
    },
  },
}
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-2xl">📈</span>
        <span class="font-semibold text-lg tracking-wide text-gray-500">
          Acquisition Timeline ({{ selectedYear }})
        </span>
      </div>
      <select v-model="selectedYear" class="border rounded px-2 py-1 text-sm">
        <option v-for="year in yearsAvailable" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>

    <div v-if="loading.value" class="p-4 text-center text-gray-500">Loading chart...</div>

    <div v-else-if="!hasFunkos" class="p-4 text-center text-gray-400">
      No Funko Pops data available.
    </div>

    <div v-else>
      <Line :data="chartData" :options="chartOptions" height="220" />
    </div>

    <!-- Debug output (optional, remove later) -->
    <!-- <pre class="text-xs text-gray-400 mt-4">{{ funkos }}</pre> -->
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
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.dashboard-card-header {
  border-bottom: 1px solid #ececec;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
}
</style>
