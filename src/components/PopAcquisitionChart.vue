<script setup>
import { computed, ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { useUserFunkos } from '../composables/useUserFunkos'

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
)

const { funkos, loading } = useUserFunkos()
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

function parseAddedAt(addedAt) {
  if (!addedAt) return null
  if (typeof addedAt === 'object' && typeof addedAt.toDate === 'function') return addedAt.toDate()
  const date = new Date(addedAt)
  return Number.isNaN(date.getTime()) ? null : date
}

const yearsAvailable = computed(() => {
  const years = new Set()
  funkos.value.forEach((pop) => {
    const date = parseAddedAt(pop.addedAt)
    if (date) years.add(date.getFullYear())
  })
  const sortedYears = Array.from(years).sort((a, b) => b - a)
  return sortedYears.length ? sortedYears : [currentYear]
})

const monthlyCounts = computed(() => {
  const months = Array(12).fill(0)
  funkos.value.forEach((pop) => {
    const date = parseAddedAt(pop.addedAt)
    if (date?.getFullYear() === selectedYear.value) months[date.getMonth()] += 1
  })
  return months
})

const hasDatedFunkos = computed(() => monthlyCounts.value.some((count) => count > 0))
const yearlyTotal = computed(() => monthlyCounts.value.reduce((total, count) => total + count, 0))

const chartData = computed(() => ({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: `Pops added in ${selectedYear.value}`,
      data: monthlyCounts.value,
      borderColor: '#8a9a5b',
      backgroundColor: 'rgba(138, 154, 91, 0.14)',
      borderWidth: 2,
      pointBackgroundColor: '#2f4f4f',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.32,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      callbacks: {
        label: (context) => `${context.raw} ${context.raw === 1 ? 'Pop' : 'Pops'} added`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#74786e' },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, stepSize: 1, color: '#74786e' },
      grid: { color: 'rgba(47, 79, 79, 0.08)' },
      border: { display: false },
    },
  },
}

watch(yearsAvailable, (years) => {
  if (!years.includes(selectedYear.value)) selectedYear.value = years[0]
})
</script>

<template>
  <article class="dashboard-card timeline-card" aria-labelledby="timeline-title">
    <header class="card-header">
      <div>
        <p class="card-kicker">Growth over time</p>
        <h2 id="timeline-title">Acquisition timeline</h2>
        <p class="card-summary">{{ yearlyTotal }} Pops recorded in {{ selectedYear }}</p>
      </div>

      <label class="year-control">
        <span>Year</span>
        <select v-model="selectedYear">
          <option v-for="year in yearsAvailable" :key="year" :value="year">{{ year }}</option>
        </select>
      </label>
    </header>

    <div v-if="loading" class="chart-skeleton" aria-label="Loading acquisition timeline"></div>

    <div v-else-if="!hasDatedFunkos" class="empty-state">
      <span class="pi pi-chart-line" aria-hidden="true"></span>
      <p>No dated additions for {{ selectedYear }}.</p>
      <small>Acquisition activity will appear as you add Pops.</small>
    </div>

    <div v-else class="chart-wrap" aria-label="Monthly Funko Pop acquisition line chart">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </article>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.card-kicker {
  margin: 0 0 0.1rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
}

.card-summary {
  margin: 0.2rem 0 0;
  color: #74786e;
  font-size: 0.85rem;
}

.year-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #676b62;
  font-size: 0.8rem;
  font-weight: 700;
}

.year-control select {
  min-height: 40px;
  padding: 0.4rem 2rem 0.4rem 0.65rem;
  border: 1px solid rgba(47, 79, 79, 0.22);
  border-radius: 8px;
  background: white;
  color: var(--funkollection-text);
}

.year-control select:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.3);
  outline-offset: 2px;
}

.chart-wrap,
.chart-skeleton {
  height: clamp(15rem, 32vw, 21rem);
}

.chart-skeleton {
  border-radius: 10px;
  background: #eceee8;
}

.empty-state {
  display: grid;
  min-height: 15rem;
  place-items: center;
  align-content: center;
  color: #74786e;
  text-align: center;
}

.empty-state .pi {
  margin-bottom: 0.5rem;
  color: var(--funkollection-secondary);
  font-size: 1.5rem;
}

.empty-state p,
.empty-state small {
  margin: 0;
}

@media (max-width: 540px) {
  .card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .year-control {
    justify-content: space-between;
  }
}
</style>
