<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useUserFunkos } from '../composables/useUserFunkos'
import PopCountCard from '../components/PopCountCard.vue'
import PopCategoryBreakdownCard from '../components/PopCategoryBreakdownCard.vue'
import EstimatedValueCard from '../components/EstimatedValueCard.vue'
import PopAcquisitionChart from '../components/PopAcquisitionChart.vue'
import RecentAdditionsCard from '../components/RecentAdditionsCard.vue'
import MostValuablePopsCard from '../components/MostValuablePopsCard.vue'
import StickerBreakdownCard from '../components/StickerBreakdownCard.vue'
import PaywallCard from '../components/PaywallCard.vue'
import { anySubscriptionGrantsPremium } from '../utils/subscriptionEntitlement.js'

const isLoadingUserData = ref(true)
const isPremium = ref(false)
const premiumError = ref('')
const { user, error } = useUserFunkos()

let unsubscribeSubscriptions = null

onMounted(async () => {
  const currentUser = auth.currentUser

  if (!currentUser) {
    isLoadingUserData.value = false
    return
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid)
    const docSnap = await getDoc(userDocRef)

    if (docSnap.exists() && docSnap.data().isAdmin) {
      isPremium.value = true
      isLoadingUserData.value = false
      return
    }

    const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
    unsubscribeSubscriptions = onSnapshot(
      subscriptionsRef,
      (snapshot) => {
        isPremium.value = anySubscriptionGrantsPremium(
          snapshot.docs.map((subscriptionDoc) => subscriptionDoc.data()),
        )
        isLoadingUserData.value = false
      },
      () => {
        premiumError.value = 'We could not verify your membership. Please refresh and try again.'
        isLoadingUserData.value = false
      },
    )
  } catch {
    premiumError.value = 'We could not load your dashboard access. Please refresh and try again.'
    isLoadingUserData.value = false
  }
})

onBeforeUnmount(() => {
  unsubscribeSubscriptions?.()
})
</script>

<template>
  <main class="dashboard-page">
    <section v-if="isLoadingUserData" class="dashboard-status" aria-live="polite">
      <span class="status-spinner" aria-hidden="true"></span>
      <div>
        <h1>Preparing your dashboard</h1>
        <p>Gathering the latest details from your collection.</p>
      </div>
    </section>

    <section v-else-if="premiumError" class="dashboard-status dashboard-status--error" role="alert">
      <span class="pi pi-exclamation-circle" aria-hidden="true"></span>
      <div>
        <h1>Dashboard unavailable</h1>
        <p>{{ premiumError }}</p>
      </div>
    </section>

    <template v-else-if="isPremium">
      <header class="dashboard-hero">
        <div class="hero-copy">
          <p class="eyebrow">Collection overview</p>
          <h1>Your Funko dashboard</h1>
          <p class="hero-intro">
            Welcome back<span v-if="user">, {{ user.displayName || user.email }}</span
            >. See how your collection is growing and where its story is headed.
          </p>
        </div>

        <RouterLink class="primary-action" to="/collection">
          <span class="pi pi-box" aria-hidden="true"></span>
          Manage collection
        </RouterLink>
      </header>

      <div v-if="error" class="dashboard-alert" role="alert">
        <span class="pi pi-exclamation-triangle" aria-hidden="true"></span>
        <span>Some collection data could not be loaded. {{ error.message }}</span>
      </div>

      <section class="dashboard-grid" aria-label="Collection insights">
        <PopCountCard class="summary-card" />
        <EstimatedValueCard class="summary-card" />
        <PopAcquisitionChart class="dashboard-card--wide" />
        <PopCategoryBreakdownCard />
        <RecentAdditionsCard />
        <MostValuablePopsCard />
        <StickerBreakdownCard class="dashboard-card--wide" />
      </section>
    </template>

    <section v-else class="paywall-container">
      <PaywallCard feature-name="Dashboard" />
    </section>
  </main>
</template>

<style scoped>
.dashboard-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.dashboard-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  width: min(100%, 1280px);
  margin: 0 auto 1.5rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--funkollection-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dashboard-hero h1 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.08;
}

.hero-intro {
  max-width: 46rem;
  margin: 0.75rem 0 0;
  color: #5f625b;
  font-size: clamp(0.95rem, 1.5vw, 1.08rem);
}

.primary-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 44px;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  background: var(--funkollection-secondary);
  color: white;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.primary-action:hover {
  background: var(--funkollection-primary);
  transform: translateY(-1px);
}

.primary-action:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.35);
  outline-offset: 3px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
  width: min(100%, 1280px);
  margin: 0 auto;
}

.dashboard-grid > :deep(*) {
  grid-column: span 6;
}

.dashboard-grid > :deep(.summary-card) {
  grid-column: span 6;
}

.dashboard-grid > :deep(.dashboard-card--wide) {
  grid-column: span 12;
}

.dashboard-grid :deep(.dashboard-card) {
  min-width: 0;
  min-height: 100%;
  margin: 0;
  padding: clamp(1.15rem, 2vw, 1.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.dashboard-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  width: min(100%, 1280px);
  margin: 0 auto 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #e3b9ae;
  border-radius: 8px;
  background: #fff5f2;
  color: #7a3526;
}

.dashboard-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 55vh;
  padding: 2rem;
  text-align: left;
}

.dashboard-status h1 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
}

.dashboard-status p {
  margin: 0.2rem 0 0;
  color: #686b64;
}

.dashboard-status--error {
  color: #8a3a2a;
}

.dashboard-status--error .pi {
  font-size: 1.5rem;
}

.status-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(138, 154, 91, 0.25);
  border-top-color: var(--funkollection-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.paywall-container {
  display: grid;
  min-height: 70vh;
  place-items: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .dashboard-grid > :deep(*) {
    grid-column: span 12;
  }

  .dashboard-grid > :deep(.summary-card) {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 1rem;
  }

  .dashboard-hero {
    align-items: stretch;
    flex-direction: column;
    gap: 1.25rem;
  }

  .primary-action {
    width: 100%;
  }

  .dashboard-grid > :deep(.summary-card) {
    grid-column: span 12;
  }
}

@media (max-width: 420px) {
  .dashboard-page {
    padding-inline: 0.75rem;
  }

  .dashboard-hero {
    padding: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-action {
    transition: none;
  }

  .status-spinner {
    animation-duration: 1.8s;
  }
}
</style>
