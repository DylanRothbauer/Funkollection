<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase.js'
import { doc, getDoc } from 'firebase/firestore'
import Button from 'primevue/button'
import PopCountCard from '../components/PopCountCard.vue'
import PopCategoryBreakdownCard from '../components/PopCategoryBreakdownCard.vue'
import BadgesCard from '../components/BadgesCard.vue'
import EstimatedValueCard from '../components/EstimatedValueCard.vue'
import PopAcquisitionChart from '../components/PopAcquisitionChart.vue'
import RecentAdditionsCard from '@/components/RecentAdditionsCard.vue'
import MostValuablePopsCard from '@/components/MostValuablePopsCard.vue'
import PaywallCard from '@/components/PaywallCard.vue'
import { useUserFunkos } from '../composables/useUserFunkos'
import { useAuthUser } from '../composables/useAuthUser.js'
import { collection, onSnapshot } from 'firebase/firestore'
import { app, auth } from '../firebase.js'
import { getCheckoutUrl } from '../../stripePayment.js'

const isLoadingUserData = ref(false) // Change to true when fetching user data
const isPremium = ref(false) // Track if user is a premium member

const { user, error } = useUserFunkos() // just for user display and error handling

onMounted(() => {
  const currentUser = auth.currentUser
  if (!currentUser) return

  const userDocRef = doc(db, 'users', currentUser.uid)
  getDoc(userDocRef).then((docSnap) => {
    if (docSnap.exists() && docSnap.data().isAdmin) {
      isPremium.value = true
      isLoadingUserData.value = false
      return // stop here for admins
    }

    // Only check subscription if not admin
    const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
    onSnapshot(subscriptionsRef, (snapshot) => {
      isPremium.value = snapshot.docs.some(doc => {
        const data = doc.data()
        return data.status === 'active' || data.status === 'trialing'
      })
      isLoadingUserData.value = false
    })
  })
})
</script>

<template>
  <div v-if="isLoadingUserData" class="loading-state">
    <p>Loading dashboard...</p>
  </div>

  <!-- Premium Dashboard View -->
  <div v-else-if="isPremium">

    <header class="flex items-center justify-between p-4 bg-white shadow-sm rounded-b-lg mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Funko Dashboard</h1>
      <span v-if="user" class="text-lg text-gray-600">
        Welcome, {{ user.displayName || user.email }}
      </span>
    </header>

    <div class="flex flex-wrap justify-center gap-8 px-4 py-8 dashboard-cards-container">
      <PopCountCard />
      <PopCategoryBreakdownCard />
      <PopAcquisitionChart />
      <EstimatedValueCard />
      <RecentAdditionsCard />
      <MostValuablePopsCard />
    </div>

    <div v-if="error" class="text-red-500">Error: {{ error.message }}</div>
  </div>

  <!-- Paywall / Upgrade View for Standard Members -->
  <div v-else class="paywall-container">
    <PaywallCard feature-name="Dashboard"></PaywallCard>
  </div>
</template>

<style scoped>
.paywall-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--funkollection-background);
}

.dashboard-cards-container {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #666;
  font-size: 1.125rem;
}

</style>
