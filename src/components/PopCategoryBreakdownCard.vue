<script setup>
import { ref, watch, computed } from 'vue'
import Chart from 'primevue/chart'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos() // use shared reactive funkos here

const chartData = ref(null)
const backgroundColors = [
  '#3B82F6',
  '#F97316',
  '#EF4444',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#6B7280',
]

// Computed property to check if funkos exist and have items
const hasFunkos = computed(() => Array.isArray(funkos?.value) && funkos.value.length > 0)

function computeCategoryData() {
  const categoryCount = {}

  funkos.value.forEach((pop) => {
    let series = null

    // Prefer series if valid non-empty string
    if (pop.series && pop.series.trim()) {
      series = pop.series.trim()
    }
    // fallback to category if series missing or empty
    else if (pop.category && pop.category.trim()) {
      series = pop.category.trim()
    }

    if (!series) {
      console.warn('[CategoryBreakdown] Pop with missing series/category:', pop)
      series = 'No Series'
    }

    categoryCount[series] = (categoryCount[series] || 0) + 1
  })

  // Sort by descending count
  const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])

  // Take top 6 categories and sum rest as 'Other'
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

// Recompute whenever funkos updates
watch(
  funkos,
  () => {
    computeCategoryData()
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="pop-card shadow rounded-lg bg-white flex flex-col items-center justify-center py-8 px-6"
    style="min-width: 320px; min-height: 340px"
  >
    <div class="font-semibold text-lg text-gray-500 mb-4" style="letter-spacing: 0.03em">
      Top Categories
    </div>

    <div v-if="loading" class="text-2xl text-gray-400">...</div>

    <template v-else>
      <div v-if="!hasFunkos" class="text-gray-400 text-lg">No Pops in your collection yet.</div>

      <div
        v-else-if="!chartData?.labels?.length || !chartData.datasets[0]?.data.some((v) => v > 0)"
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

<style scoped></style>
