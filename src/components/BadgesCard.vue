<script setup>
import { computed } from 'vue'

const props = defineProps({
  funkos: { type: Array, required: true },
  loading: { type: Boolean, required: true },
})

const badgeBgColor = '#ffd700' // gold for pop count
const valueBadgeBgColor = '#34d399' // green for value

const badgeLevels = [
  { min: 1, name: 'Pop Collector', desc: 'Added your first Pop!', icon: '🥉' },
  { min: 10, name: 'Pop Collector', desc: 'Own 10+ Pops', icon: '🥈' },
  { min: 50, name: 'Pop Collector', desc: 'Own 50+ Pops', icon: '🥇' },
  { min: 100, name: 'Pop Collector', desc: 'Own 100+ Pops', icon: '🏆' },
]

const valueBadgeLevels = [
  { min: 0, name: 'Value Collector', desc: 'Start your collection!', icon: '🧾' },
  { min: 100, name: 'Value Collector', desc: 'Spent $100+', icon: '💵' },
  { min: 500, name: 'Value Collector', desc: 'Spent $500+', icon: '💰' },
  { min: 1000, name: 'Value Collector', desc: 'Spent $1,000+', icon: '🤑' },
  { min: 5000, name: 'Value Collector', desc: 'Spent $5,000+', icon: '🏦' },
]

const popCount = computed(() => props.funkos.length)
const totalValue = computed(() => {
  return props.funkos.reduce((sum, pop) => {
    const qty = pop.quantity || 1
    return sum + (parseFloat(pop.purchasePrice) || 0) * qty
  }, 0)
})

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

const valueBadge = computed(() => {
  const value = totalValue.value
  let current = valueBadgeLevels[0]
  let next = null
  let level = 1
  for (let i = 0; i < valueBadgeLevels.length; i++) {
    if (value >= valueBadgeLevels[i].min) {
      current = valueBadgeLevels[i]
      level = i + 1
      next = valueBadgeLevels[i + 1] || null
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

const valueProgress = computed(() => {
  const value = totalValue.value
  const currentLevel = valueBadge.value
  const nextLevel = currentLevel.next
  if (!nextLevel) return 1
  const prevMin = currentLevel.min
  const nextMin = nextLevel.min
  return Math.min(1, (value - prevMin) / (nextMin - prevMin))
})
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header flex items-center mb-4">
      <span class="text-2xl mr-2">🏅</span>
      <span class="font-semibold text-lg tracking-wide text-gray-500">Badges</span>
    </div>
    <div v-if="props.loading" class="p-4 text-center text-gray-500">Loading badges...</div>
    <div v-else class="flex flex-wrap gap-5">
      <div
        v-if="badge"
        class="badge"
        :style="{
          background: badgeBgColor,
          color: '#222',
          border: badge.level === badgeLevels.length ? '2px solid #a3a3a3' : 'none',
        }"
      >
        <div class="badge-content">
          <div class="badge-icon">{{ badge.icon }}</div>
          <div class="badge-title">{{ badge.name }}</div>
          <div class="badge-level">Lv.{{ badge.level }}</div>
          <div class="badge-desc">{{ badge.desc }}</div>
          <div class="progress-bar-container">
            <div class="progress-bar-bg" :class="{ 'progress-bar-max': !badge.next }">
              <div
                class="progress-bar-fill"
                :class="{ 'progress-bar-max-fill': !badge.next }"
                :style="{ width: progress * 100 + '%' }"
              ></div>
            </div>
            <div class="progress-label text-xs mt-1">
              <template v-if="badge.next">
                {{ popCount }} / {{ badge.next.min }} Pops to next level
              </template>
              <template v-else> Max Level! </template>
            </div>
          </div>
        </div>
      </div>
      <div
        class="badge"
        :style="{
          background: valueBadgeBgColor,
          color: '#222',
          border: valueBadge.level === valueBadgeLevels.length ? '2px solid #065f46' : 'none',
        }"
      >
        <div class="badge-content">
          <div class="badge-icon">{{ valueBadge.icon }}</div>
          <div class="badge-title">{{ valueBadge.name }}</div>
          <div class="badge-level">Lv.{{ valueBadge.level }}</div>
          <div class="badge-desc">{{ valueBadge.desc }}</div>
          <div class="progress-bar-container">
            <div class="progress-bar-bg" :class="{ 'progress-bar-max': !valueBadge.next }">
              <div
                class="progress-bar-fill"
                :class="{ 'progress-bar-max-fill': !valueBadge.next }"
                :style="{ width: valueProgress * 100 + '%' }"
              ></div>
            </div>
            <div class="progress-label text-xs mt-1">
              <template v-if="valueBadge.next">
                ${{ totalValue.toFixed(0) }} / ${{ valueBadge.next.min }} to next level
              </template>
              <template v-else> Max Level! </template>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!badge && !valueBadge" class="text-gray-400 w-full text-center mt-2">
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
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.dashboard-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.02);
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
  height: 14px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid #bdbdbd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  transition: background 0.3s;
}
.progress-bar-fill {
  height: 100%;
  background: #4ade80;
  border-radius: 6px 0 0 6px;
  transition:
    width 0.4s cubic-bezier(0.4, 2, 0.6, 1),
    background 0.3s;
}
.progress-bar-max {
  background: #d1d5db !important;
}
.progress-bar-max-fill {
  background: #a3a3a3 !important;
}
</style>
