<script setup>
import { ref, onMounted } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'
import { useAuthUser } from '../composables/useAuthUser.js'
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
import router from '@/router/index.js'
import { getCheckoutUrl } from '../../stripePayment.ts'
import { app, auth } from '../firebase.js'
// import { getPremiumStatus } from '../../getPremiumStatus.ts'
import { collection, onSnapshot } from 'firebase/firestore'

const { user, error } = useUserFunkos() // just for user display and error handling
const isLoadingUserData = ref(false) // Change to true when fetching user data
const isPremium = ref(false) // Track if user is a premium member

// Stripe
const upgradeToPremium = async () => {
  console.log('Upgrade to Premium clicked - Stripe integration coming soon')
  const priceId = "price_1T2K3pQ9qrN939D8iluIXhKm";
  try {
    const checkoutUrl = await getCheckoutUrl(app, priceId);
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Error during upgrade:', error);
  }
};

onMounted(() => {
  const currentUser = auth.currentUser
  if (!currentUser) return

  const subscriptionsRef = collection(
    db,
    "customers",
    currentUser.uid,
    "subscriptions"
  )

  onSnapshot(subscriptionsRef, (snapshot) => {
    const hasActiveSubscription = snapshot.docs.some(doc => {
      const data = doc.data()
      return data.status === "active" || data.status === "trialing"
    })

    isPremium.value = hasActiveSubscription
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
    <div class="paywall-card">
      <div class="paywall-content">
        <i class="pi pi-lock paywall-icon"></i>
        <h2 class="paywall-title">Dashboard is a Premium Feature</h2>
        <p class="paywall-description">
          Unlock full analytics, detailed insights, and complete collection management with a Premium membership.
        </p>

        <div class="paywall-features">
          <div class="feature">
            <i class="pi pi-check"></i>
            <span>Complete collection analytics</span>
          </div>
          <div class="feature">
            <i class="pi pi-check"></i>
            <span>Advanced charts and graphs</span>
          </div>
          <div class="feature">
            <i class="pi pi-check"></i>
            <span>Detailed statistics</span>
          </div>
          <div class="feature">
            <i class="pi pi-check"></i>
            <span>Priority support</span>
          </div>
        </div>

        <Button
          label="Upgrade to Premium"
          icon="pi pi-arrow-right"
          @click="upgradeToPremium"
          class="upgrade-button"
        />

        <p class="paywall-footer">
          Signed in as {{ user ? (user.displayName || user.email) : 'Guest' }} <br>
          With membership status: {{ isPremium ? 'Premium' : 'Standard' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.paywall-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--funkollection-background);
}

.paywall-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
}

.paywall-content {
  padding: 3rem 2rem;
  text-align: center;
}

.paywall-icon {
  font-size: 3rem;
  color: var(--funkollection-secondary);
  display: block;
  margin-bottom: 1rem;
}

.paywall-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 1rem 0;
}

.paywall-description {
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.paywall-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
  text-align: left;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 0.5rem;
}

.feature i {
  color: #4caf50;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.feature span {
  color: #333;
  font-weight: 500;
}

.upgrade-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  margin: 2rem 0;
  background: var(--funkollection-secondary) !important;
  color: var(--funkollection-soft-white) !important;
}

.upgrade-button:hover {
  background: var(--funkollection-primary) !important;
}

.paywall-footer {
  font-size: 0.9rem;
  color: #999;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .paywall-container {
    padding: 1rem;
  }

  .paywall-content {
    padding: 2rem 1.5rem;
  }

  .paywall-title {
    font-size: 1.25rem;
  }

  .paywall-icon {
    font-size: 2.5rem;
  }
}
</style>
