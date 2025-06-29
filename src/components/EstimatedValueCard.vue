<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

const loading = ref(true)
const totalPurchase = ref(0)

onMounted(() => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userFunkosSnapshot = await getDocs(collection(db, 'users', firebaseUser.uid, 'funkos'))
      let purchase = 0
      userFunkosSnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const qty = data.quantity || 1
        purchase += (parseFloat(data.purchasePrice) || 0) * qty
      })
      totalPurchase.value = purchase
    }
    loading.value = false
  })
})
</script>

<template>
  <div class="dashboard-card flex flex-col items-center justify-center">
    <div class="font-semibold text-lg text-gray-500 mb-2">Collection Value</div>
    <div v-if="loading" class="text-gray-400 text-xl">Loading...</div>
    <div v-else class="w-full flex flex-col items-center gap-2">
      <div class="text-6xl font-extrabold mb-2" style="color: var(--funkollection-secondary)">
        ${{ totalPurchase.toFixed(2) }}
      </div>
      <div class="text-lg text-gray-600">Total purchase price of your collection</div>
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
  min-width: 320px;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.dashboard-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.02);
}
</style>
