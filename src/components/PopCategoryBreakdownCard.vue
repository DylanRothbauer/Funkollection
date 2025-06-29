<script setup>
import { ref, watch } from 'vue'
import Chart from 'primevue/chart'

const props = defineProps({
  funkos: { type: Array, required: true },
  loading: { type: Boolean, required: true },
})

const chartData = ref({ labels: [], datasets: [] })
const chartOptions = ref({
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  responsive: true,
  maintainAspectRatio: false,
})

const backgroundColors = [
  '#7c3aed',
  '#f59e42',
  '#10b981',
  '#f43f5e',
  '#6366f1',
  '#fbbf24',
  '#a3a3a3',
]

function computeCategoryData() {
  const categoryCount = {}
  props.funkos.forEach((pop) => {
    let series = 'No Series'
    if (pop.series && pop.series.trim()) {
      series = pop.series.trim()
    } else if (pop.category && pop.category.trim()) {
      series = pop.category.trim()
    }
    categoryCount[series] = (categoryCount[series] || 0) + 1
  })
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
        backgroundColor: backgroundColors,
        borderWidth: 0,
      },
    ],
  }
}

watch(() => props.funkos, computeCategoryData, { immediate: true })
</script>

<template>
  <div
    class="pop-category-card shadow rounded-lg bg-white flex flex-col items-center justify-center py-8 px-6"
    style="min-width: 320px; min-height: 340px"
  >
    <div class="font-semibold text-lg text-gray-500 mb-4" style="letter-spacing: 0.03em">
      Top Categories
    </div>
    <div v-if="props.loading" class="text-2xl text-gray-400">...</div>
    <template v-else>
      <div v-if="!props.funkos.length" class="text-gray-400 text-lg">
        No Pops in your collection yet.
      </div>
      <div
        v-else-if="!chartData.labels.length || !chartData.datasets[0]?.data.some((v) => v > 0)"
        class="text-gray-400 text-lg"
      >
        No category data available.
      </div>
      <template v-else>
        <Chart
          type="doughnut"
          :data="chartData"
          :options="chartOptions"
          style="width: 220px; height: 220px"
        />
        <div class="mt-4 w-full flex flex-col items-center">
          <div
            v-for="(label, i) in chartData.labels"
            :key="label"
            class="flex items-center gap-2 mb-1 text-base"
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
            <span class="font-semibold text-gray-700">{{ label }}</span>
            <span class="ml-2 font-extrabold text-gray-900 text-lg">{{
              chartData.datasets[0].data[i]
            }}</span>
          </div>
          <div class="text-lg text-gray-600 mt-2">Breakdown of your collection by series</div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.pop-category-card {
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
.pop-category-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.02);
}
</style>
