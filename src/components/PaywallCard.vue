<script setup>
import router from '@/router/index.js'
import { ref, onMounted } from 'vue'
import { useAuthUser } from '../composables/useAuthUser.js'
import { db } from '../firebase.js'
import { doc, getDoc } from 'firebase/firestore'
import Button from 'primevue/button'
import { getCheckoutUrl } from '../../stripePayment.js'

// Props for dynamic content
const props = defineProps({
  featureName: {
    type: String,
    default: 'This Feature'
  }
})

const { user, loading } = useAuthUser()
const membershipTier = ref('Standard Member')
const isLoadingUserData = ref(false)
const isAdmin = ref(false)

const fetchMembershipTier = async () => {
  if (!user.value) return
  isLoadingUserData.value = true
  try {
    const userDocRef = doc(db, 'users', user.value.uid)
    const userDocSnap = await getDoc(userDocRef)
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      membershipTier.value = userData.membershipTier || 'Standard Member'
      isAdmin.value = userData.isAdmin || false
    }
  } catch (error) {
    console.error('Error fetching user membership:', error)
  } finally {
    isLoadingUserData.value = false
  }
}

const upgradeToPremium = async () => {
  const priceId = "price_1T86oGLancjOeFyBC9PctmbE"
  try {
    const { getApp } = await import('firebase/app')
    const firebaseApp = getApp()
    const checkoutUrl = await getCheckoutUrl(firebaseApp, priceId)
    window.location.href = checkoutUrl
  } catch (error) {
    console.error('Error during upgrade:', error)
  }
}

onMounted(() => {
  fetchMembershipTier()
})
</script>

<template>
  <div class="paywall-card">
    <div class="paywall-content">

      <!-- Admin view -->
      <div v-if="isAdmin">
        <i class="pi pi-shield paywall-icon" style="color: var(--funkollection-secondary)"></i>
        <h2 class="paywall-title">Admin Account</h2>
        <p class="paywall-description">You have full access to all features as an admin.</p>
      </div>

      <!-- Normal paywall view -->
      <div v-else>
        <i class="pi pi-lock paywall-icon"></i>
        <h2 class="paywall-title">{{ featureName }} is a Premium Feature</h2>
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
          Membership: {{ membershipTier }}
        </p>
      </div>

    </div>
  </div>
</template>
<style scoped>

.paywall-card {
  display: flex;
  align-items: center;
  justify-content: center;
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
