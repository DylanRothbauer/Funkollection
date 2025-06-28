<script setup>
import { ref, onMounted, computed } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const user = ref(null)
const popCount = ref(0)
const loading = ref(true)

const badgeLevels = [
  { min: 1, name: 'Pop Collector', desc: 'Added your first Pop!', color: '#cd7f32', icon: '🥉' },
  { min: 10, name: 'Pop Collector', desc: 'Own 10+ Pops', color: '#bfc1c2', icon: '🥈' },
  { min: 50, name: 'Pop Collector', desc: 'Own 50+ Pops', color: '#ffd700', icon: '🥇' },
  { min: 100, name: 'Pop Collector', desc: 'Own 100+ Pops', color: '#e5e4e2', icon: '🏆' },
]

const badge = computed(() => {
  const count = popCount.value
  let current = badgeLevels[0]
  let next = null
  let level = 1
  for (let i = 0; i < badgeLevels.length; i++) {
    if (count >= badgeLevels[i].min) {
      current = badgeLevels[i]
      level = i + 1
      next = badgeLevels[i + 1] || null
    }
  }
  return { ...current, level, next }
})

const progress = computed(() => {
  const count = popCount.value
  const currentLevel = badge.value
  const nextLevel = currentLevel.next
  if (!nextLevel) return 1 // Maxed out
  const prevMin = currentLevel.min
  const nextMin = nextLevel.min
  return Math.min(1, (count - prevMin) / (nextMin - prevMin))
})

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      const userFunkosSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
      popCount.value = userFunkosSnapshot.size
    }
    loading.value = false
  })
})
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header flex items-center mb-4">
      <span class="text-2xl mr-2">🏅</span>
      <span class="font-semibold text-lg tracking-wide text-gray-500">Badges</span>
    </div>
    <div v-if="loading" class="p-4 text-center text-gray-500">Loading badges...</div>
    <div v-else class="flex flex-wrap gap-5">
      <div
        v-if="badge"
        class="badge"
        :style="{
          background: badge.color,
          color: badge.color === '#bfc1c2' ? '#222' : '#fff',
          border: badge.color === '#e5e4e2' ? '2px solid #a3a3a3' : 'none',
        }"
      >
        <div class="badge-content">
          <div class="badge-icon">{{ badge.icon }}</div>
          <div class="badge-title">{{ badge.name }}</div>
          <div class="badge-level">Lv.{{ badge.level }}</div>
          <div class="badge-desc">{{ badge.desc }}</div>
          <div v-if="badge.next" class="progress-bar-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: progress * 100 + '%' }"></div>
            </div>
            <div class="progress-label text-xs mt-1">
              {{ popCount }} / {{ badge.next.min }} Pops to next level
            </div>
          </div>
          <div v-else class="progress-label text-xs mt-2">Max Level!</div>
        </div>
      </div>
      <div v-else class="text-gray-400 w-full text-center mt-2">
        No badges yet. Start collecting!
      </div>
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
}
.dashboard-card-header {
  border-bottom: 1px solid #ececec;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
}
.badge {
  display: block;
  width: 140px;
  min-height: 80px;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 0.5rem;
  padding: 1rem 0.5rem;
  text-align: center;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
  cursor: pointer;
  position: relative;
}
.badge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: auto;
  padding: 0;
  box-sizing: border-box;
}
.badge-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.2rem;
  letter-spacing: 0.01em;
  text-align: center;
}
.badge-icon {
  font-size: 2.2rem;
  margin-bottom: 0.1rem;
  line-height: 1;
}
.badge-level {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
  color: #222;
}
.progress-bar-container {
  width: 100%;
  margin-top: 0.7rem;
}
.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: #4ade80;
  border-radius: 4px 0 0 4px;
  transition: width 0.4s cubic-bezier(0.4, 2, 0.6, 1);
}
.progress-label {
  text-align: center;
  color: #444;
}
</style>
