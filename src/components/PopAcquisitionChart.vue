<script setup>
import { ref, onMounted, watch } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { Line } from 'vue-chartjs'
import { Chart, LineElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js'

Chart.register(LineElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

const user = ref(null)
const loading = ref(true)
const allPops = ref([])
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const chartData = ref({ labels: [], datasets: [] })

function groupByMonth(pops, year) {
  const months = Array(12).fill(0)
  pops.forEach((pop) => {
    if (pop.addedAt) {
      let date
      if (typeof pop.addedAt === 'object' && typeof pop.addedAt.toDate === 'function') {
        date = pop.addedAt.toDate()
      } else {
        date = new Date(pop.addedAt)
      }
      console.log('Pop addedAt:', pop.addedAt, 'Parsed date:', date)
      if (date.getFullYear() === year) {
        months[date.getMonth()]++
      }
    }
  })
  return months
}

async function fetchPops() {
  loading.value = true
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      const snapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
      const pops = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        pops.push(data)
      })
      allPops.value = pops
      console.log('Fetched pops:', pops)
      updateChart()
    }
    loading.value = false
  })
}

function updateChart() {
  const months = groupByMonth(allPops.value, selectedYear.value)
  console.log('Months array for year', selectedYear.value, months)
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

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        stepSize: 1,
        callback: function (value) {
          return Number(value).toFixed(0)
        },
      },
    },
  },
}

onMounted(fetchPops)
watch(selectedYear, updateChart)
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header flex items-center mb-4">
      <span class="text-2xl mr-2">📈</span>
      <span class="font-semibold text-lg tracking-wide text-gray-500"
        >Acquisition Timeline ({{ selectedYear }})</span
      >
    </div>
    <div v-if="loading" class="p-4 text-center text-gray-500">Loading chart...</div>
    <div v-else>
      <Line :data="chartData" :options="chartOptions" height="220" />
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
