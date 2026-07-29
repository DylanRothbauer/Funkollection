<script setup>
import { computed, onMounted, ref } from 'vue'
import { getAuth } from 'firebase/auth'
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useToast } from 'primevue/usetoast'
import { db } from '../firebase.js'
import AppPageHeader from '@/components/AppPageHeader.vue'
import PaywallCard from '@/components/PaywallCard.vue'
import { anySubscriptionGrantsPremium } from '../utils/subscriptionEntitlement.js'

const auth = getAuth()
const toast = useToast()
const isPremium = ref(false)
const isLoadingUserData = ref(true)
const isLoadingBadges = ref(true)
const loadError = ref('')
const unlockedBadgeIds = ref(new Set())
const badgeProgress = ref({})

const BADGES = [
  {
    id: 'first_pop',
    label: 'First Pop',
    icon: 'pi-star',
    desc: 'Add your first Funko Pop',
    req: { type: 'count', value: 1 },
  },
  {
    id: 'getting_started',
    label: 'Getting Started',
    icon: 'pi-thumbs-up',
    desc: 'Own 5 Funko Pops',
    req: { type: 'count', value: 5 },
  },
  {
    id: 'collector',
    label: 'Collector',
    icon: 'pi-box',
    desc: 'Own 25 Funko Pops',
    req: { type: 'count', value: 25 },
  },
  {
    id: 'serious_collector',
    label: 'Serious Collector',
    icon: 'pi-crown',
    desc: 'Own 50 Funko Pops',
    req: { type: 'count', value: 50 },
  },
  {
    id: 'century_club',
    label: 'Century Club',
    icon: 'pi-trophy',
    desc: 'Own 100 Funko Pops',
    req: { type: 'count', value: 100 },
  },
  {
    id: 'pop_hoarder',
    label: 'Pop Hoarder',
    icon: 'pi-inbox',
    desc: 'Own 200 Funko Pops',
    req: { type: 'count', value: 200 },
  },
  {
    id: 'legend',
    label: 'Legend',
    icon: 'pi-verified',
    desc: 'Own 500 Funko Pops',
    req: { type: 'count', value: 500 },
  },
  {
    id: 'variety_pack',
    label: 'Variety Pack',
    icon: 'pi-th-large',
    desc: 'Own Pops from 5 different series',
    req: { type: 'series', value: 5 },
  },
  {
    id: 'genre_master',
    label: 'Genre Master',
    icon: 'pi-globe',
    desc: 'Own Pops from 10 different series',
    req: { type: 'series', value: 10 },
  },
  {
    id: 'world_collector',
    label: 'World Collector',
    icon: 'pi-map',
    desc: 'Own Pops from 25 different series',
    req: { type: 'series', value: 25 },
  },
  {
    id: 'invested',
    label: 'Invested',
    icon: 'pi-chart-line',
    desc: 'Spend over $250 on your collection',
    req: { type: 'value', value: 250 },
  },
  {
    id: 'big_spender',
    label: 'Big Spender',
    icon: 'pi-dollar',
    desc: 'Spend over $500 on your collection',
    req: { type: 'value', value: 500 },
  },
  {
    id: 'high_roller',
    label: 'High Roller',
    icon: 'pi-wallet',
    desc: 'Spend over $1000 on your collection',
    req: { type: 'value', value: 1000 },
  },
  {
    id: 'whale',
    label: 'Whale',
    icon: 'pi-arrow-up',
    desc: 'Spend over $2500 on your collection',
    req: { type: 'value', value: 2500 },
  },
  {
    id: 'first_favorite',
    label: 'First Favorite',
    icon: 'pi-heart',
    desc: 'Add your first favorite Pop',
    req: { type: 'favorites', value: 1 },
  },
  {
    id: 'favorite_five',
    label: 'Favorite Five',
    icon: 'pi-heart-fill',
    desc: 'Have 5 favorite Pops',
    req: { type: 'favorites', value: 5 },
  },
]

const GROUPS = [
  {
    type: 'count',
    label: 'Collection milestones',
    description: 'Grow the number of Pops in your collection.',
  },
  {
    type: 'series',
    label: 'Collection variety',
    description: 'Explore and collect across more series.',
  },
  {
    type: 'value',
    label: 'Recorded investment',
    description: 'Track the purchase value of your collection.',
  },
  {
    type: 'favorites',
    label: 'Personal favorites',
    description: 'Curate the Pops that matter most to you.',
  },
]

onMounted(async () => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    isLoadingUserData.value = false
    isLoadingBadges.value = false
    return
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    const userData = userDocSnap.data()

    if (userData?.isAdmin) {
      isPremium.value = true
    } else {
      const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
      const subSnap = await getDocs(subscriptionsRef)
      isPremium.value = anySubscriptionGrantsPremium(
        subSnap.docs.map((subscriptionDoc) => subscriptionDoc.data()),
      )
    }

    isLoadingUserData.value = false
    if (!isPremium.value) return

    const [funkosSnap, favoritesSnap] = await Promise.all([
      getDocs(collection(db, 'users', currentUser.uid, 'funkos')),
      getDocs(collection(db, 'users', currentUser.uid, 'favorites')),
    ])

    const funkos = funkosSnap.docs.map((funkoDoc) => ({ id: funkoDoc.id, ...funkoDoc.data() }))
    const favoritesCount = favoritesSnap.docs.length
    const funkoDetails = await Promise.all(
      funkos.map(async (userFunko) => {
        const globalDoc = await getDoc(doc(db, 'FunkoPops', userFunko.id))
        const globalData = globalDoc.exists() ? globalDoc.data() : {}
        return { ...userFunko, series: globalData.series || userFunko.series || '' }
      }),
    )

    const totalCount = funkoDetails.length
    const uniqueSeries = new Set(funkoDetails.map((funko) => funko.series).filter(Boolean)).size
    const totalValue = funkoDetails.reduce(
      (sum, funko) => sum + (Number.parseFloat(funko.purchasePrice) || 0),
      0,
    )

    badgeProgress.value = {
      count: totalCount,
      series: uniqueSeries,
      value: totalValue,
      favorites: favoritesCount,
    }

    const badgesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'badges'))
    const alreadyUnlocked = new Set(badgesSnap.docs.map((badgeDoc) => badgeDoc.id))
    const newlyUnlocked = []

    for (const badge of BADGES) {
      const { type, value } = badge.req
      let earned = false
      if (type === 'count') earned = totalCount >= value
      if (type === 'series') earned = uniqueSeries >= value
      if (type === 'value') earned = totalValue >= value
      if (type === 'favorites') earned = favoritesCount >= value

      if (earned) {
        unlockedBadgeIds.value.add(badge.id)
        if (!alreadyUnlocked.has(badge.id)) {
          await setDoc(doc(db, 'users', currentUser.uid, 'badges', badge.id), {
            unlockedAt: new Date().toISOString(),
          })
          newlyUnlocked.push(badge.label)
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((label) => {
        toast.add({
          severity: 'success',
          summary: 'Badge unlocked',
          detail: label,
          life: 4000,
        })
      })
      await updateDoc(userDocRef, { newBadges: deleteField() })
    }
  } catch {
    loadError.value = 'We could not load your badge progress. Please refresh and try again.'
  } finally {
    isLoadingUserData.value = false
    isLoadingBadges.value = false
  }
})

function isUnlocked(badge) {
  return unlockedBadgeIds.value.has(badge.id)
}

function getProgress(badge) {
  const current = Number(badgeProgress.value[badge.req.type]) || 0
  const target = badge.req.value
  return {
    current: Math.min(current, target),
    target,
    percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
  }
}

function formatProgressValue(badge, value) {
  if (badge.req.type === 'value') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return value.toLocaleString()
}

const unlockedCount = computed(() => unlockedBadgeIds.value.size)
const completionPercent = computed(() => Math.round((unlockedCount.value / BADGES.length) * 100))
const badgeGroups = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    badges: BADGES.filter((badge) => badge.req.type === group.type),
  })),
)
</script>

<template>
  <main class="feature-page">
    <section v-if="isLoadingUserData" class="page-status" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <div>
        <h1>Preparing your achievements</h1>
        <p>Checking your collection progress.</p>
      </div>
    </section>

    <section v-else-if="!isPremium" class="paywall-container">
      <PaywallCard feature-name="Badges" />
    </section>

    <template v-else>
      <AppPageHeader
        eyebrow="Collection milestones"
        title="Badges"
        description="Celebrate meaningful steps in your collection and see exactly what to work toward next."
        icon="pi-verified"
      />

      <section v-if="loadError" class="error-state" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        <div>
          <h2>Badge progress unavailable</h2>
          <p>{{ loadError }}</p>
        </div>
      </section>

      <template v-else>
        <section class="progress-overview" aria-labelledby="progress-title">
          <div class="progress-copy">
            <p class="section-kicker">Overall progress</p>
            <h2 id="progress-title">{{ unlockedCount }} of {{ BADGES.length }} badges earned</h2>
            <p>Every addition, series, recorded purchase, and favorite can move you forward.</p>
          </div>
          <div class="progress-score">
            <strong>{{ completionPercent }}%</strong>
            <span>complete</span>
          </div>
          <div
            class="overview-track"
            role="progressbar"
            aria-label="Overall badge completion"
            :aria-valuenow="completionPercent"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span :style="{ width: `${completionPercent}%` }"></span>
          </div>
        </section>

        <div v-if="isLoadingBadges" class="badge-skeleton" aria-live="polite">
          <span v-for="index in 8" :key="index"></span>
        </div>

        <template v-else>
          <section
            v-for="group in badgeGroups"
            :key="group.type"
            class="badge-section"
            :aria-labelledby="`${group.type}-title`"
          >
            <header class="section-header">
              <div>
                <p class="section-kicker">Achievement track</p>
                <h2 :id="`${group.type}-title`">{{ group.label }}</h2>
                <p>{{ group.description }}</p>
              </div>
              <span>
                {{ group.badges.filter((badge) => isUnlocked(badge)).length }} /
                {{ group.badges.length }} earned
              </span>
            </header>

            <div class="badges-grid">
              <article
                v-for="badge in group.badges"
                :key="badge.id"
                class="badge-card"
                :class="{ 'badge-card--unlocked': isUnlocked(badge) }"
              >
                <div class="badge-topline">
                  <span class="badge-icon">
                    <i :class="['pi', badge.icon]" aria-hidden="true"></i>
                  </span>
                  <span class="status-pill">
                    <i
                      :class="['pi', isUnlocked(badge) ? 'pi-check-circle' : 'pi-lock']"
                      aria-hidden="true"
                    ></i>
                    {{ isUnlocked(badge) ? 'Earned' : 'In progress' }}
                  </span>
                </div>

                <div class="badge-copy">
                  <h3>{{ badge.label }}</h3>
                  <p>{{ badge.desc }}</p>
                </div>

                <div class="badge-progress">
                  <div class="progress-label">
                    <span>Progress</span>
                    <strong>{{ getProgress(badge).percent }}%</strong>
                  </div>
                  <div
                    class="progress-track"
                    role="progressbar"
                    :aria-label="`${badge.label} progress`"
                    :aria-valuenow="getProgress(badge).percent"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span :style="{ width: `${getProgress(badge).percent}%` }"></span>
                  </div>
                  <p class="progress-values">
                    {{ formatProgressValue(badge, getProgress(badge).current) }} of
                    {{ formatProgressValue(badge, getProgress(badge).target) }}
                  </p>
                </div>
              </article>
            </div>
          </section>
        </template>
      </template>
    </template>
  </main>
</template>

<style scoped>
.feature-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.feature-page > * {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.progress-overview,
.badge-section,
.error-state {
  margin-top: 1rem;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.progress-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem 2rem;
  padding: clamp(1.15rem, 2vw, 1.5rem);
}

.section-kicker {
  margin: 0 0 0.15rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

h2 {
  font-size: 1.45rem;
}

h3 {
  font-size: 1.18rem;
}

.progress-copy > p:last-child,
.section-header p,
.badge-copy p {
  margin: 0.3rem 0 0;
  color: #70746b;
}

.progress-score {
  display: flex;
  flex-direction: column;
  color: var(--funkollection-primary);
  text-align: right;
}

.progress-score strong {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.5rem;
  line-height: 1;
}

.progress-score span {
  color: #74786e;
  font-size: 0.8rem;
}

.overview-track,
.progress-track {
  overflow: hidden;
  border-radius: 999px;
  background: #e8eae4;
}

.overview-track {
  grid-column: 1 / -1;
  height: 0.65rem;
}

.overview-track span,
.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--funkollection-secondary);
}

.badge-section {
  padding: clamp(1.15rem, 2vw, 1.5rem);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-header > span {
  flex: 0 0 auto;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(138, 154, 91, 0.12);
  color: var(--funkollection-primary);
  font-size: 0.78rem;
  font-weight: 800;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
}

.badge-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.15rem;
  border: 1px solid rgba(47, 79, 79, 0.13);
  border-radius: 12px;
  background: #fafaf7;
}

.badge-card--unlocked {
  border-color: rgba(138, 154, 91, 0.55);
  background: rgba(138, 154, 91, 0.06);
}

.badge-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.badge-icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 10px;
  background: #e7e8e2;
  color: #6d7169;
  font-size: 1.15rem;
}

.badge-card--unlocked .badge-icon {
  background: var(--funkollection-secondary);
  color: white;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #6c7068;
  font-size: 0.72rem;
  font-weight: 800;
}

.badge-card--unlocked .status-pill {
  color: var(--funkollection-primary);
}

.badge-copy {
  flex: 1;
}

.badge-copy p {
  font-size: 0.86rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  color: #6c7068;
  font-size: 0.76rem;
}

.progress-label strong {
  color: var(--funkollection-primary);
}

.progress-track {
  height: 0.45rem;
}

.progress-values {
  margin: 0.35rem 0 0;
  color: #767a72;
  font-size: 0.72rem;
  text-align: right;
}

.badge-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
  width: min(100%, 1280px);
  margin: 1rem auto 0;
}

.badge-skeleton span {
  height: 15rem;
  border-radius: 12px;
  background: #eceee8;
}

.error-state,
.page-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 14rem;
  padding: 2rem;
}

.error-state {
  color: #7a3526;
}

.error-state .pi,
.page-status .pi {
  font-size: 1.5rem;
}

.error-state p,
.page-status p {
  margin: 0.2rem 0 0;
}

.paywall-container {
  display: grid;
  min-height: 70vh;
  place-items: center;
}

@media (max-width: 768px) {
  .feature-page {
    padding: 1rem;
  }

  .progress-overview {
    grid-template-columns: 1fr;
  }

  .progress-score {
    text-align: left;
  }

  .section-header {
    flex-direction: column;
  }

  .badges-grid,
  .badge-skeleton {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overview-track span,
  .progress-track span {
    transition: none;
  }
}
</style>
