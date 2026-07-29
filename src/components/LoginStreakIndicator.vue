<script setup>
import { computed, ref } from 'vue'
import { useAuthUser } from '../composables/useAuthUser.js'
import { useLoginStreak } from '../composables/useLoginStreak.js'

defineProps({
  compact: { type: Boolean, default: false },
  light: { type: Boolean, default: false },
})

const isOpen = ref(false)
const { user } = useAuthUser()
const {
  loading,
  error,
  announcement,
  newlyCredited,
  currentStreak,
  highestStreak,
  creditedToday,
  evaluateForUser,
} = useLoginStreak()

const dayLabel = computed(() => (currentStreak.value === 1 ? 'day' : 'days'))
const accessibleLabel = computed(() => {
  if (loading.value) return 'Checking daily login streak.'
  if (error.value) return 'Daily login streak is temporarily unavailable. Activate to retry.'
  return `Current login streak: ${currentStreak.value} ${dayLabel.value}. ${
    creditedToday.value ? 'Today has been counted.' : 'Today has not been counted.'
  }`
})

function toggle() {
  if (error.value) {
    evaluateForUser(user.value?.uid, { force: true })
    return
  }
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div
    class="streak-indicator"
    :class="{ 'streak-indicator--compact': compact, 'streak-indicator--light': light }"
  >
    <button
      type="button"
      class="streak-trigger"
      :class="{
        'streak-trigger--active': currentStreak > 0,
        'streak-trigger--celebrate': newlyCredited,
        'streak-trigger--error': error,
      }"
      :aria-label="accessibleLabel"
      :aria-expanded="isOpen"
      :aria-haspopup="error ? undefined : 'dialog'"
      @click="toggle"
      @keydown.esc="isOpen = false"
    >
      <span v-if="loading" class="streak-skeleton" aria-hidden="true"></span>
      <template v-else>
        <svg class="streak-flame" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M13.7 2.7c.4 3.3-1.5 4.7-2.9 6.3-1.1 1.3-1.8 2.6-1.1 4.5.5-1.4 1.5-2.2 2.8-3.1-.2 2.2 2.1 3.1 2.1 5.4 0 1.7-1.2 3-2.8 3-2.8 0-4.8-2.1-4.8-5.1 0-3.8 2.8-6.3 6.7-11Z"
          />
          <path
            class="streak-flame-core"
            d="M12.1 13.2c.1 1.2 1.2 1.7 1.2 2.8 0 .9-.6 1.6-1.5 1.6-1.2 0-2-.9-2-2.1 0-1.1.7-2.1 2.3-3.6v1.3Z"
          />
        </svg>
        <strong>{{ error ? '—' : currentStreak }}</strong>
        <span v-if="!compact" class="streak-label">{{ dayLabel }}</span>
      </template>
    </button>

    <div v-if="isOpen && !error" class="streak-popover" role="dialog" aria-label="Daily streak">
      <strong>{{ currentStreak }} {{ dayLabel }} strong</strong>
      <p>
        {{
          creditedToday
            ? 'Today is counted. Return on the next UTC calendar day to keep growing.'
            : 'Connect to record today’s visit.'
        }}
      </p>
      <span>Personal best: {{ highestStreak }} {{ highestStreak === 1 ? 'day' : 'days' }}</span>
      <small>Daily credit resets at 00:00 UTC.</small>
    </div>

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.streak-indicator {
  position: relative;
  min-width: 0;
}

.streak-trigger {
  display: inline-flex;
  min-width: 5.4rem;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.7);
  font: inherit;
  cursor: pointer;
}

.streak-trigger:hover,
.streak-trigger:focus-visible,
.streak-trigger--active {
  border-color: rgba(255, 208, 128, 0.42);
  background: rgba(255, 255, 255, 0.11);
  color: white;
}

.streak-trigger:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.34);
  outline-offset: 2px;
}

.streak-trigger--error {
  color: rgba(255, 255, 255, 0.58);
}

.streak-flame {
  width: 1.25rem;
  height: 1.25rem;
  fill: #a9b6ad;
  transform-origin: 50% 80%;
}

.streak-trigger--active .streak-flame {
  fill: #f1a33c;
}

.streak-flame-core {
  fill: #ffe1a3;
}

.streak-trigger strong {
  font-size: 0.9rem;
  line-height: 1;
}

.streak-label {
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.68rem;
}

.streak-skeleton {
  width: 3.5rem;
  height: 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.streak-popover {
  position: absolute;
  z-index: 60;
  bottom: calc(100% + 0.65rem);
  left: 0;
  display: grid;
  width: min(17rem, calc(100vw - 2rem));
  gap: 0.35rem;
  padding: 0.9rem;
  border: 1px solid rgba(47, 79, 79, 0.14);
  border-radius: 10px;
  background: white;
  color: var(--funkollection-text);
  box-shadow: 0 12px 30px rgba(24, 40, 34, 0.18);
}

.streak-popover strong {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

.streak-popover p,
.streak-popover span,
.streak-popover small {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.5;
}

.streak-popover span {
  color: var(--funkollection-secondary);
  font-weight: 800;
}

.streak-popover small {
  color: #737970;
}

.streak-indicator--compact .streak-trigger {
  min-width: 48px;
  height: 42px;
  padding-inline: 0.55rem;
}

.streak-indicator--light .streak-trigger {
  border-color: rgba(47, 79, 79, 0.16);
  background: rgba(250, 243, 224, 0.62);
  color: var(--funkollection-primary);
}

.streak-indicator--light .streak-trigger:hover,
.streak-indicator--light .streak-trigger:focus-visible,
.streak-indicator--light .streak-trigger--active {
  border-color: rgba(138, 154, 91, 0.5);
  background: rgba(138, 154, 91, 0.12);
  color: var(--funkollection-primary);
}

.streak-indicator--light .streak-trigger:focus-visible {
  outline-color: rgba(138, 154, 91, 0.36);
}

.streak-indicator--light .streak-label {
  color: #68705f;
}

.streak-indicator--light .streak-popover {
  top: calc(100% + 0.65rem);
  right: 0;
  bottom: auto;
  left: auto;
}

.streak-indicator--compact .streak-popover {
  top: calc(100% + 0.65rem);
  right: 0;
  bottom: auto;
  left: auto;
}

.streak-trigger--celebrate .streak-flame {
  animation: flame-credit 0.7s ease-out both;
}

@keyframes flame-credit {
  0% {
    transform: scale(0.82) translateY(2px);
  }
  45% {
    filter: drop-shadow(0 0 7px rgba(241, 163, 60, 0.7));
    transform: scale(1.22) translateY(-2px);
  }
  100% {
    filter: none;
    transform: scale(1);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .streak-trigger--celebrate .streak-flame {
    animation: none;
  }
}
</style>
