<script setup>
import { computed, ref, watch } from 'vue'
import Chart from 'primevue/chart'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()
const chartData = ref(null)
const backgroundColors = [
  '#2f4f4f',
  '#8a9a5b',
  '#c28f52',
  '#6f7f69',
  '#a8674f',
  '#b4a56a',
  '#8b8176',
]

const hasFunkos = computed(() => Array.isArray(funkos.value) && funkos.value.length > 0)

function computeCategoryData() {
  const categoryCount = {}

  funkos.value.forEach((pop) => {
    const series = pop.series?.trim() || pop.category?.trim() || 'No series'
    categoryCount[series] = (categoryCount[series] || 0) + 1
  })

  const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 6)
  const otherCount = sorted.slice(6).reduce((sum, [, count]) => sum + count, 0)

  if (otherCount > 0) top.push(['Other', otherCount])

  chartData.value = {
    labels: top.map(([label]) => label),
    datasets: [
      {
        data: top.map(([, count]) => count),
        backgroundColor: backgroundColors,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 500,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.raw} Pops`,
      },
    },
  },
  cutout: '68%',
}

watch(funkos, computeCategoryData, { immediate: true })
</script>

<template>
  <article class="dashboard-card category-card" aria-labelledby="category-title">
    <header class="card-header">
      <div>
        <p class="card-kicker">Collection mix</p>
        <h2 id="category-title">Top series</h2>
      </div>
      <span class="pi pi-chart-pie card-icon" aria-hidden="true"></span>
    </header>

    <div v-if="loading" class="chart-skeleton" aria-label="Loading series breakdown"></div>

    <div v-else-if="!hasFunkos" class="empty-state">
      <span class="pi pi-chart-pie" aria-hidden="true"></span>
      <p>No collection data yet.</p>
      <small>Your most collected series will appear here.</small>
    </div>

    <div v-else-if="!chartData?.labels?.length" class="empty-state">
      <p>No series information is available.</p>
    </div>

    <div v-else class="chart-layout">
      <div class="chart-wrap" aria-label="Doughnut chart of top Funko series">
        <Chart type="doughnut" :data="chartData" :options="chartOptions" />
      </div>
      <ul class="legend-list" aria-label="Series totals">
        <li v-for="(label, index) in chartData.labels" :key="label">
          <span
            class="legend-dot"
            :style="{ backgroundColor: chartData.datasets[0].backgroundColor[index] }"
            aria-hidden="true"
          ></span>
          <span class="legend-label">{{ label }}</span>
          <strong>{{ chartData.datasets[0].data[index] }}</strong>
        </li>
      </ul>
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

.card-icon {
  color: var(--funkollection-secondary);
  font-size: 1.2rem;
}

.chart-layout {
  display: grid;
  grid-template-columns: minmax(10rem, 0.9fr) minmax(10rem, 1.1fr);
  align-items: center;
  gap: 1.25rem;
}

.chart-wrap {
  height: 190px;
  min-width: 0;
}

.legend-list {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend-list li {
  display: grid;
  grid-template-columns: 0.65rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  color: #62665e;
  font-size: 0.86rem;
}

.legend-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}

.legend-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-list strong {
  color: var(--funkollection-primary);
}

.empty-state {
  display: grid;
  min-height: 13rem;
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

.chart-skeleton {
  height: 13rem;
  border-radius: 10px;
  background: #eceee8;
}

@media (max-width: 540px) {
  .chart-layout {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chart-wrap {
    --p-chart-animation-duration: 0ms;
  }
}
</style>
