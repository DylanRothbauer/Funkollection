<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthUser } from '../composables/useAuthUser.js'
import Button from 'primevue/button'
import { getCheckoutUrl, getPortalUrl } from '../../stripePayment.js'
import { getPremiumStatus } from '../../getPremiumStatus.js'
import { app } from '../firebase.js'
import { getAuth } from 'firebase/auth'

const { user } = useAuthUser()
const isPremium = ref(false)
const isLoadingUserData = ref(false)
const auth = getAuth(app)

const upgradeToPremium = async () => {
  try {
    const priceId = "price_1T86oGLancjOeFyBC9PctmbE";
    const checkoutUrl = await getCheckoutUrl(app, priceId);
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Error during upgrade:', error);
  }
};

const manageSubscription = async () => {
  try {
    const portalUrl = await getPortalUrl(app);
    window.location.href = portalUrl;
  } catch (error) {
    console.error('Error managing subscription:', error);
  }
}

const checkPremiumStatus = async () => {
  if (!auth.currentUser?.uid) return

  isLoadingUserData.value = true
  try {
    const newPremiumStatus = await getPremiumStatus(app)
    isPremium.value = newPremiumStatus
    console.log('Premium status:', newPremiumStatus)
  } catch (error) {
    console.error('Error checking premium status:', error)
    isPremium.value = false
  } finally {
    isLoadingUserData.value = false
  }
}

// Watch for user changes and check premium status
watch(() => user.value, () => {
  if (user.value) {
    checkPremiumStatus()
  }
}, { deep: true })

onMounted(() => {
  checkPremiumStatus()
})
</script>

<template>
  <div class="account-container">
    <div v-if="isLoadingUserData" class="loading-state">
      <p style="color: black;">Loading account information...</p>
    </div>

    <div v-else-if="isPremium" class="premium-content">
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
  background: var(--funkollection-secondary);
  color: var(--funkollection-soft-white);
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  margin-top: 1rem;
}

.action-button:hover {
  background: var(--funkollection-primary) !important;
  color: var(--funkollection-soft-white) !important;
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
