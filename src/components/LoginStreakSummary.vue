<script setup>
import { computed } from 'vue'
import { useAuthUser } from '../composables/useAuthUser.js'
import { useLoginStreak } from '../composables/useLoginStreak.js'

const { user } = useAuthUser()
const { streak, loading, error, currentStreak, highestStreak, creditedToday, evaluateForUser } =
  useLoginStreak()

const lastCreditedLabel = computed(() => streak.value?.lastCreditedDate || 'Not recorded')
</script>

<template>
  <div class="streak-summary">
    <div v-if="loading && !streak" class="streak-summary-state" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      Checking your daily streak
    </div>
    <div v-else-if="error && !streak" class="streak-summary-state streak-summary-state--error">
      <span>{{ error }}</span>
      <button type="button" @click="evaluateForUser(user?.uid, { force: true })">Try again</button>
    </div>
    <template v-else>
      <div class="streak-metrics">
        <div>
          <span>Current streak</span>
          <strong>{{ currentStreak }}</strong>
          <small>{{ currentStreak === 1 ? 'day' : 'days' }}</small>
        </div>
        <div>
          <span>Personal best</span>
          <strong>{{ highestStreak }}</strong>
          <small>{{ highestStreak === 1 ? 'day' : 'days' }}</small>
        </div>
      </div>
      <p>
        <i class="pi pi-check-circle" aria-hidden="true"></i>
        {{
          creditedToday
            ? `Today’s visit is counted (${lastCreditedLabel}).`
            : 'Connect to record today’s visit.'
        }}
      </p>
      <small>Calendar days follow UTC and reset at 00:00 UTC.</small>
    </template>
  </div>
</template>

<style scoped>
.streak-summary {
  padding-top: 1.2rem;
}

.streak-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.streak-metrics > div {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: 0.2rem 0.4rem;
  padding: 1rem;
  border: 1px solid rgba(47, 79, 79, 0.11);
  border-radius: 9px;
  background: rgba(250, 243, 224, 0.42);
}

.streak-metrics span {
  grid-column: 1 / -1;
  color: #737970;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.streak-metrics strong {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2rem;
  line-height: 1;
}

.streak-metrics small {
  color: #72776f;
  font-size: 0.72rem;
}

.streak-summary > p {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.85rem 0 0.2rem;
  color: var(--funkollection-primary);
  font-size: 0.75rem;
  font-weight: 750;
}

.streak-summary > p i {
  color: var(--funkollection-secondary);
}

.streak-summary > small {
  color: #737970;
  font-size: 0.68rem;
}

.streak-summary-state {
  display: flex;
  min-height: 5rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #70766d;
  font-size: 0.75rem;
}

.streak-summary-state--error {
  flex-wrap: wrap;
}

.streak-summary-state button {
  min-height: 38px;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(47, 79, 79, 0.2);
  border-radius: 7px;
  background: white;
  color: var(--funkollection-primary);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 420px) {
  .streak-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
