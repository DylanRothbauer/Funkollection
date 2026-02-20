<script setup>
import { ref, onMounted } from 'vue'
import { useAuthUser } from '../composables/useAuthUser.js'
import { db } from '../firebase.js'
import { doc, getDoc } from 'firebase/firestore'
import Button from 'primevue/button'

const { user } = useAuthUser()
const membershipTier = ref('Standard Member')
const isLoadingUserData = ref(true)

const upgradeToPremium = async () => {
  console.log('Upgrade to Premium clicked - Stripe integration coming soon')
  // TODO: Implement Stripe payment flow
}

const manageSubscription = () => {
  console.log('Manage Subscription clicked - functionality coming soon')
}

const fetchMembershipTier = async () => {
  if (!user.value) return

  isLoadingUserData.value = true
  try {
    const userDocRef = doc(db, 'users', user.value.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      membershipTier.value = userData.membershipTier || 'Standard Member'
    }
  } catch (error) {
    console.error('Error fetching user membership:', error)
  } finally {
    isLoadingUserData.value = false
  }
}

onMounted(() => {
  fetchMembershipTier()
})
</script>

<template>
  <div class="account-container">
    <div v-if="isLoadingUserData" class="loading-state">
      <p style="color: black;">Loading account information...</p>
    </div>

    <div v-else-if="membershipTier === 'Premium Member'" class="premium-content">
      <div class="account-card">
        <i class="pi pi-check-circle premium-badge-icon"></i>
        <h2>{{ user?.displayName || user?.email }}</h2>
        <p class="membership-status">Premium Member</p>
        <p class="description">Thank you for being a premium member! Enjoy full access to all features.</p>
        <Button
          label="Manage Subscription"
          icon="pi pi-cog"
          @click="manageSubscription"
          class="action-button"
        />
      </div>
    </div>

    <div v-else class="standard-content">
      <div class="account-card">
        <i class="pi pi-lock paywall-icon"></i>
        <h2>{{ user?.displayName || user?.email }}</h2>
        <p class="membership-status">Standard Member</p>
        <p class="description">Upgrade to Premium to unlock full analytics, detailed insights, and complete collection management.</p>
        <Button
          label="Upgrade to Premium"
          icon="pi pi-arrow-right"
          @click="upgradeToPremium"
          class="action-button upgrade-button"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--funkollection-background);
}

.loading-state {
  color: white;
  font-size: 1.125rem;
  text-align: center;
}

.account-card {
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.premium-badge-icon {
  font-size: 3rem;
  color: #4caf50;
  display: block;
  margin-bottom: 1.5rem;
}

.paywall-icon {
  font-size: 3rem;
  color: var(--funkollection-secondary);
  display: block;
  margin-bottom: 1.5rem;
}

.account-card h2 {
  font-size: 1.75rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.membership-status {
  font-size: 1rem;
  font-weight: 500;
  color: var(--funkollection-soft-white);
  margin: 0 0 1rem 0;
}

.description {
  font-size: 1rem;
  color: #666;
  margin: 1rem 0 2rem 0;
  line-height: 1.6;
}

.action-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  margin-top: 1rem;
}

.upgrade-button {
  background: var(--funkollection-secondary);
  border: none;
  color: white;
}

.upgrade-button:hover {
  background: var(--funkollection-primary) !important;
  color: white !important;
}

@media (max-width: 768px) {
  .account-container {
    padding: 1rem;
  }

  .account-card {
    padding: 2rem 1.5rem;
  }

  .account-card h2 {
    font-size: 1.5rem;
  }

  .premium-badge-icon,
  .paywall-icon {
    font-size: 2.5rem;
  }
}
</style>
