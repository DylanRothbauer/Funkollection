<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase.js'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import PaywallCard from '@/components/PaywallCard.vue'
import { useToast } from 'primevue/usetoast'

const auth = getAuth()
const toast = useToast()

const isPremium = ref(false)
const isLoadingUserData = ref(true)
const isLoadingBadges = ref(true)
const unlockedBadgeIds = ref(new Set())

/*
Structure:
{
  id: 'unique_id',      // unique snake_case identifier, never change this once set
  label: 'Badge Name',  // displayed on the card
  icon: 'pi-icon-name', // any PrimeIcon name
  desc: 'Description',  // shown under the label
  req: { type: 'count', value: 25 } // the unlock condition
}

Notes:
Don't change id, since its stored in firestore under here -> users/{uid}/badges/{id}
Don't change req.type & req.value - for users who already unlocked

*/
const BADGES = [
  // Collection Size
  { id: 'first_pop',         label: 'First Pop',         icon: 'pi-star',      desc: 'Add your first Funko Pop',            req: { type: 'count',  value: 1 } },
  { id: 'getting_started',   label: 'Getting Started',   icon: 'pi-thumbs-up', desc: 'Own 5 Funko Pops',                    req: { type: 'count',  value: 5 } },
  { id: 'collector',         label: 'Collector',         icon: 'pi-box',       desc: 'Own 25 Funko Pops',                   req: { type: 'count',  value: 25 } },
  { id: 'serious_collector', label: 'Serious Collector', icon: 'pi-crown',     desc: 'Own 50 Funko Pops',                   req: { type: 'count',  value: 50 } },
  { id: 'century_club',      label: 'Century Club',      icon: 'pi-trophy',    desc: 'Own 100 Funko Pops',                  req: { type: 'count',  value: 100 } },
  { id: 'pop_hoarder',       label: 'Pop Hoarder',       icon: 'pi-inbox',     desc: 'Own 200 Funko Pops',                  req: { type: 'count',  value: 200 } },
  { id: 'legend',            label: 'Legend',            icon: 'pi-verified',  desc: 'Own 500 Funko Pops',                  req: { type: 'count',  value: 500 } },
  // Series/Variety
  { id: 'variety_pack',      label: 'Variety Pack',      icon: 'pi-th-large',  desc: 'Own Pops from 5 different series',    req: { type: 'series', value: 5 } },
  { id: 'genre_master',      label: 'Genre Master',      icon: 'pi-globe',     desc: 'Own Pops from 10 different series',   req: { type: 'series', value: 10 } },
  { id: 'world_collector',   label: 'World Collector',   icon: 'pi-map',       desc: 'Own Pops from 25 different series',   req: { type: 'series', value: 25 } },
  // Value
  { id: 'invested',          label: 'Invested',          icon: 'pi-chart-line',desc: 'Spend over $250 on your collection',  req: { type: 'value',  value: 250 } },
  { id: 'big_spender',       label: 'Big Spender',       icon: 'pi-dollar',    desc: 'Spend over $500 on your collection',  req: { type: 'value',  value: 500 } },
  { id: 'high_roller',       label: 'High Roller',       icon: 'pi-wallet',    desc: 'Spend over $1000 on your collection', req: { type: 'value',  value: 1000 } },
  { id: 'whale',             label: 'Whale',             icon: 'pi-arrow-up',  desc: 'Spend over $2500 on your collection', req: { type: 'value',  value: 2500 } },
  // Favorites
  { id: 'first_favorite',    label: 'First Favorite',    icon: 'pi-heart',     desc: 'Add your first favorite Pop',         req: { type: 'favorites',value: 1 } },
  { id: 'favorite_five',     label: 'Favorite Five',     icon: 'pi-heart-fill',desc: 'Have 5 favorite Pops',                req: { type: 'favorites',value: 5 } },
]

// Progress tracking for partially completed badges
const badgeProgress = ref({})

onMounted(async () => {
  const currentUser = auth.currentUser
  if (!currentUser) return

  // Check admin/premium
  const userDocRef = doc(db, 'users', currentUser.uid)
  const userDocSnap = await getDoc(userDocRef)
  const userData = userDocSnap.data()

  if (userData?.isAdmin) {
    isPremium.value = true
  } else {
    const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
    const subSnap = await getDocs(subscriptionsRef)
    isPremium.value = subSnap.docs.some(d => {
      const data = d.data()
      return data.status === 'active' || data.status === 'trialing'
    })
  }

  isLoadingUserData.value = false
  if (!isPremium.value) return

  // Fetch user's funkos and favorites in parallel for efficiency
  const [funkosSnap, favoritesSnap] = await Promise.all([                          // NEW
    getDocs(collection(db, 'users', currentUser.uid, 'funkos')),
    getDocs(collection(db, 'users', currentUser.uid, 'favorites')),                // NEW
  ])

  const funkos = funkosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const favoritesCount = favoritesSnap.docs.length                                 // NEW

  // Fetch global FunkoPops for series data
  const funkoDetails = await Promise.all(funkos.map(async (userFunko) => {
    const globalDoc = await getDoc(doc(db, 'FunkoPops', userFunko.id))
    const globalData = globalDoc.exists() ? globalDoc.data() : {}
    return {
      ...userFunko,
      series: globalData.series || userFunko.series || '',
    }
  }))

  // Compute stats
  const totalCount = funkoDetails.length
  const uniqueSeries = new Set(funkoDetails.map(f => f.series).filter(Boolean)).size
  const totalValue = funkoDetails.reduce((sum, f) => sum + (parseFloat(f.purchasePrice) || 0), 0)

  // Store progress for display (keys must match req.type in BADGES array)
  badgeProgress.value = {
    count: totalCount,
    series: uniqueSeries,
    value: totalValue,
    favorites: favoritesCount,                                                     // NEW
  }

  // Fetch already unlocked badges
  const badgesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'badges'))
  const alreadyUnlocked = new Set(badgesSnap.docs.map(d => d.id))

  // Check each badge and unlock if newly earned
  const newlyUnlocked = []
  for (const badge of BADGES) {
    const { type, value } = badge.req
    let earned = false

    if (type === 'count')     earned = totalCount >= value
    if (type === 'series')    earned = uniqueSeries >= value
    if (type === 'value')     earned = totalValue >= value
    if (type === 'favorites') earned = favoritesCount >= value                     // NEW

    if (earned) {
      unlockedBadgeIds.value.add(badge.id)
      if (!alreadyUnlocked.has(badge.id)) {
        await setDoc(doc(db, 'users', currentUser.uid, 'badges', badge.id), {
          unlockedAt: new Date().toISOString()
        })
        newlyUnlocked.push(badge.label)
      }
    }
  }

  // Show toast for newly unlocked badges
  if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach(label => {
      toast.add({
        severity: 'success',
        summary: '🏆 Badge Unlocked!',
        detail: label,
        life: 4000
      })
    })
    await updateDoc(userDocRef, { newBadges: deleteField() })
  }

  isLoadingBadges.value = false
})

function isUnlocked(badge) {
  return unlockedBadgeIds.value.has(badge.id)
}

function getProgress(badge) {
  const current = badgeProgress.value[badge.req.type] || 0
  const target = badge.req.value
  return { current: Math.min(current, target), target, percent: Math.min(100, Math.round((current / target) * 100)) }
}

const unlockedCount = computed(() => unlockedBadgeIds.value.size)
</script>

<template>
  <div v-if="isLoadingUserData" class="loading-state">
    <p>Loading...</p>
  </div>

  <div v-else-if="!isPremium" class="paywall-container">
    <PaywallCard feature-name="Badges" />
  </div>

  <div v-else class="badges-container">
    <header class="flex items-center justify-between p-4 bg-white shadow-sm rounded-b-lg mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Badges</h1>
        <p class="text-sm text-gray-400 mt-1">{{ unlockedCount }} / {{ BADGES.length }} unlocked</p>
      </div>
    </header>

    <div v-if="isLoadingBadges" class="flex items-center justify-center py-16">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--funkollection-secondary)"></i>
    </div>

    <div v-else class="badges-grid">
      <div
        v-for="badge in BADGES"
        :key="badge.id"
        class="badge-card"
        :class="{ 'badge-card--unlocked': isUnlocked(badge), 'badge-card--locked': !isUnlocked(badge) }"
      >
        <!-- Icon -->
        <div class="badge-icon-wrapper">
          <i :class="['pi', badge.icon, 'badge-icon']"></i>
          <i v-if="!isUnlocked(badge)" class="pi pi-lock lock-overlay"></i>
        </div>

        <!-- Label -->
        <div class="badge-label">{{ badge.label }}</div>

        <!-- Description -->
        <div class="badge-desc">{{ badge.desc }}</div>

        <!-- Progress bar -->
        <div class="badge-progress">
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :style="{ width: getProgress(badge).percent + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            <template v-if="badge.req.type === 'value'">
              ${{ Math.min(badgeProgress.value || 0, badge.req.value).toFixed(0) }} / ${{ badge.req.value }}
            </template>
            <template v-else>
              {{ getProgress(badge).current }} / {{ getProgress(badge).target }}
            </template>
          </div>
        </div>

        <!-- Unlock date -->
        <div v-if="isUnlocked(badge)" class="badge-unlocked-date">
          <i class="pi pi-check-circle"></i> Unlocked!
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badges-container {
  background: var(--funkollection-background);
  min-height: 100vh;
  padding-bottom: 2rem;
}

.paywall-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--funkollection-background);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #666;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0 1.5rem;
}

.badge-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
}

.badge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.badge-card--unlocked {
  border: 2px solid var(--funkollection-secondary);
}

.badge-card--locked {
  opacity: 0.6;
  filter: grayscale(0.4);
}

.badge-icon-wrapper {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--funkollection-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.badge-card--unlocked .badge-icon-wrapper {
  background: var(--funkollection-secondary);
}

.badge-icon {
  font-size: 1.5rem;
  color: #999;
}

.badge-card--unlocked .badge-icon {
  color: white;
}

.lock-overlay {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 0.8rem;
  background: #ccc;
  color: white;
  border-radius: 50%;
  width: 1.2rem;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #333;
}

.badge-desc {
  font-size: 0.78rem;
  color: #888;
  line-height: 1.4;
}

.badge-progress {
  width: 100%;
  margin-top: 0.5rem;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--funkollection-secondary);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 0.72rem;
  color: #aaa;
  text-align: right;
  margin-top: 0.25rem;
}

.badge-unlocked-date {
  font-size: 0.75rem;
  color: var(--funkollection-secondary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .badges-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 0.75rem;
    gap: 1rem;
  }
}
</style>
