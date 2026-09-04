<script setup>
import { computed, onMounted, ref } from 'vue'
import AppEmptyState from '../components/AppEmptyState.vue'
import AppPageHeader from '../components/AppPageHeader.vue'
import {
  getCollectionLeaderboard,
  setLeaderboardParticipation,
} from '../services/leaderboardService.js'
import {
  collectorInitial,
  formatPopCount,
  normalizeLeaderboardResponse,
  rankLabel,
} from '../utils/leaderboard.js'

const isLoading = ref(true)
const isRefreshing = ref(false)
const isSavingPreference = ref(false)
const loadError = ref('')
const preferenceError = ref('')
const leaderboard = ref(normalizeLeaderboardResponse())

const isCurrentUserInTopTen = computed(() =>
  leaderboard.value.entries.some((entry) => entry.isCurrentUser),
)
const progressMessage = computed(() => {
  const current = leaderboard.value.currentUser
  if (!current) return ''
  if (current.rank === 1) return 'You currently share the leading collection rank.'
  if (current.popsToNextRank === 0) return 'You are tied with the collector directly ahead.'
  return `${formatPopCount(current.popsToNextRank)} to tie the next rank.`
})

async function loadLeaderboard({ refresh = false } = {}) {
  if (refresh) isRefreshing.value = true
  else isLoading.value = true
  loadError.value = ''

  try {
    const response = await getCollectionLeaderboard()
    leaderboard.value = normalizeLeaderboardResponse(response)
  } catch {
    loadError.value = 'Collector rankings are temporarily unavailable. Please try again.'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

async function toggleParticipation() {
  if (isSavingPreference.value) return
  isSavingPreference.value = true
  preferenceError.value = ''
  const nextValue = !leaderboard.value.participating

  try {
    await setLeaderboardParticipation(nextValue)
    await loadLeaderboard({ refresh: true })
  } catch {
    preferenceError.value = 'Your leaderboard preference could not be updated. Please try again.'
  } finally {
    isSavingPreference.value = false
  }
}

function rankIcon(rank) {
  if (rank === 1) return 'pi-trophy'
  if (rank === 2) return 'pi-star'
  if (rank === 3) return 'pi-verified'
  return ''
}

onMounted(() => loadLeaderboard())
</script>

<template>
  <main class="leaderboard-page">
    <section v-if="isLoading" class="leaderboard-status" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <div>
        <h1>Preparing collector rankings</h1>
        <p>Loading the latest leaderboard snapshot.</p>
      </div>
    </section>

    <template v-else>
      <AppPageHeader
        eyebrow="Collector community"
        title="Collection leaderboard"
        description="See how opted-in collectors compare by the number of Pops recorded in their collections."
        icon="pi-chart-bar"
      >
        <template #actions>
          <button
            type="button"
            class="refresh-button"
            :disabled="isRefreshing"
            @click="loadLeaderboard({ refresh: true })"
          >
            <i
              :class="['pi', isRefreshing ? 'pi-spin pi-spinner' : 'pi-refresh']"
              aria-hidden="true"
            ></i>
            {{ isRefreshing ? 'Refreshing…' : 'Refresh' }}
          </button>
        </template>
      </AppPageHeader>

      <section v-if="loadError" class="error-state" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        <div>
          <h2>Leaderboard unavailable</h2>
          <p>{{ loadError }}</p>
        </div>
        <button type="button" class="secondary-button" @click="loadLeaderboard()">Try again</button>
      </section>

      <template v-else>
        <section class="rank-overview" aria-labelledby="your-rank-title">
          <div class="rank-copy">
            <p class="section-kicker">Your standing</p>
            <template v-if="leaderboard.currentUser">
              <h2 id="your-rank-title">{{ rankLabel(leaderboard.currentUser.rank) }} globally</h2>
              <p>
                {{ formatPopCount(leaderboard.currentUser.popCount) }} in your ranked collection.
                {{ progressMessage }}
              </p>
              <p
                v-if="leaderboard.currentUser.rank > 10 && leaderboard.currentUser.popsToTopTen > 0"
                class="top-ten-progress"
              >
                {{ formatPopCount(leaderboard.currentUser.popsToTopTen) }} to tie the current tenth
                position.
              </p>
            </template>
            <template v-else-if="leaderboard.participating">
              <h2 id="your-rank-title">Ranking pending</h2>
              <p>
                Add your first Pop to enter the rankings, or refresh after a recent collection
                update.
              </p>
            </template>
            <template v-else>
              <h2 id="your-rank-title">You’re not listed</h2>
              <p>
                Participation is private by default. Opt in when you’re ready to share your display
                name, avatar, and collection count.
              </p>
            </template>
          </div>

          <div v-if="leaderboard.currentUser" class="rank-score">
            <strong>{{ rankLabel(leaderboard.currentUser.rank) }}</strong>
            <span>of {{ leaderboard.totalCollectors.toLocaleString() }} ranked collectors</span>
          </div>
          <div v-else class="participation-action">
            <span class="privacy-status">
              <i class="pi pi-eye-slash" aria-hidden="true"></i>
              Not publicly ranked
            </span>
          </div>

          <div class="participation-control">
            <div>
              <strong>Appear on the Collection Leaderboard</strong>
              <p>
                Shares only your display name, avatar, and Pop count. You can opt out at any time.
              </p>
            </div>
            <button
              type="button"
              class="preference-button"
              :class="{ 'preference-button--active': leaderboard.participating }"
              :disabled="isSavingPreference"
              :aria-pressed="leaderboard.participating"
              @click="toggleParticipation"
            >
              <i
                :class="[
                  'pi',
                  isSavingPreference
                    ? 'pi-spin pi-spinner'
                    : leaderboard.participating
                      ? 'pi-check'
                      : 'pi-plus',
                ]"
                aria-hidden="true"
              ></i>
              {{
                isSavingPreference
                  ? 'Saving…'
                  : leaderboard.participating
                    ? 'Participating'
                    : 'Opt in'
              }}
            </button>
          </div>
          <p v-if="preferenceError" class="preference-error" role="alert">
            {{ preferenceError }}
          </p>
        </section>

        <section class="leaderboard-card" aria-labelledby="top-collectors-title">
          <header class="section-header">
            <div>
              <p class="section-kicker">Most Pops</p>
              <h2 id="top-collectors-title">Top collectors</h2>
              <p>Ranked by saved collection records. Equal totals share the same displayed rank.</p>
            </div>
            <span>{{ leaderboard.entries.length }} shown</span>
          </header>

          <AppEmptyState
            v-if="leaderboard.entries.length === 0"
            icon="pi-users"
            title="No collectors are ranked yet"
            description="The leaderboard will begin filling as collectors choose to participate."
          />

          <ol v-else class="ranking-list" aria-label="Top ten collectors">
            <li
              v-for="entry in leaderboard.entries"
              :key="`${entry.rank}-${entry.displayName}-${entry.popCount}`"
              class="ranking-row"
              :class="{
                'ranking-row--top-three': entry.rank <= 3,
                'ranking-row--current': entry.isCurrentUser,
              }"
            >
              <span class="rank-marker" :class="`rank-marker--${Math.min(entry.rank, 4)}`">
                <i
                  v-if="rankIcon(entry.rank)"
                  :class="['pi', rankIcon(entry.rank)]"
                  aria-hidden="true"
                ></i>
                <span class="sr-only">Rank</span>
                {{ entry.rank }}
              </span>
              <div class="collector">
                <img
                  v-if="entry.photoURL"
                  :src="entry.photoURL"
                  class="collector-avatar"
                  :alt="`${entry.displayName}'s profile`"
                  referrerpolicy="no-referrer"
                />
                <span
                  v-else
                  class="collector-avatar collector-avatar--placeholder"
                  aria-hidden="true"
                >
                  {{ collectorInitial(entry.displayName) }}
                </span>
                <div>
                  <strong>{{ entry.displayName }}</strong>
                  <span v-if="entry.isCurrentUser" class="you-label">Your ranking</span>
                  <span v-else>Funkollection collector</span>
                </div>
              </div>
              <strong class="pop-total">{{ formatPopCount(entry.popCount) }}</strong>
            </li>
          </ol>

          <div
            v-if="leaderboard.currentUser && !isCurrentUserInTopTen"
            class="current-user-row"
            aria-label="Your position outside the top ten"
          >
            <span class="rank-marker rank-marker--current">{{ leaderboard.currentUser.rank }}</span>
            <div class="collector">
              <img
                v-if="leaderboard.currentUser.photoURL"
                :src="leaderboard.currentUser.photoURL"
                class="collector-avatar"
                :alt="`${leaderboard.currentUser.displayName}'s profile`"
                referrerpolicy="no-referrer"
              />
              <span
                v-else
                class="collector-avatar collector-avatar--placeholder"
                aria-hidden="true"
              >
                {{ collectorInitial(leaderboard.currentUser.displayName) }}
              </span>
              <div>
                <strong>{{ leaderboard.currentUser.displayName }}</strong>
                <span class="you-label">Your current position</span>
              </div>
            </div>
            <strong class="pop-total">{{
              formatPopCount(leaderboard.currentUser.popCount)
            }}</strong>
          </div>

          <footer class="ranking-note">
            <i class="pi pi-shield" aria-hidden="true"></i>
            <p>
              Rankings include opted-in collectors with at least one saved Pop. Counts
              update after collection changes and may take a short time to appear.
            </p>
          </footer>
        </section>
      </template>
    </template>
  </main>
</template>

<style scoped>
.leaderboard-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.leaderboard-page > * {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.privacy-status,
.you-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  font-weight: 800;
}

.refresh-button,
.secondary-button,
.preference-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(47, 79, 79, 0.2);
  border-radius: 8px;
  background: white;
  color: var(--funkollection-primary);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}

.refresh-button:hover:not(:disabled),
.secondary-button:hover,
.preference-button:hover:not(:disabled) {
  border-color: var(--funkollection-secondary);
  background: rgba(138, 154, 91, 0.09);
}

.rank-overview,
.leaderboard-card,
.error-state {
  margin-top: 1rem;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.rank-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.25rem 2rem;
  align-items: center;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
}

.section-kicker {
  margin: 0 0 0.2rem;
  color: var(--funkollection-secondary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

h2 {
  font-size: 1.45rem;
}

.rank-copy > p:not(.section-kicker),
.section-header p {
  margin: 0.35rem 0 0;
  color: #6c7168;
}

.top-ten-progress {
  font-size: 0.78rem;
  font-weight: 700;
}

.rank-score {
  display: grid;
  max-width: 12rem;
  text-align: right;
}

.rank-score strong {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 3rem;
  line-height: 1;
}

.rank-score span {
  color: #747970;
  font-size: 0.72rem;
}

.privacy-status {
  padding: 0.4rem 0.6rem;
  background: #eef0eb;
  color: #62685f;
  font-size: 0.68rem;
}

.participation-control {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.1rem;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.participation-control strong {
  color: var(--funkollection-primary);
  font-size: 0.82rem;
}

.participation-control p {
  margin: 0.2rem 0 0;
  color: #747970;
  font-size: 0.72rem;
}

.preference-button--active {
  border-color: var(--funkollection-secondary);
  background: var(--funkollection-secondary);
  color: white;
}

.preference-error {
  grid-column: 1 / -1;
  margin: -0.5rem 0 0;
  color: #7a3526;
  font-size: 0.72rem;
}

.leaderboard-card {
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header > span {
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: rgba(138, 154, 91, 0.11);
  color: var(--funkollection-primary);
  font-size: 0.68rem;
  font-weight: 800;
}

.ranking-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.ranking-row,
.current-user-row {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  padding: 0.85rem 0.7rem;
  border-bottom: 1px solid rgba(47, 79, 79, 0.09);
}

.ranking-row--top-three {
  background: rgba(138, 154, 91, 0.04);
}

.ranking-row--current,
.current-user-row {
  background: rgba(138, 154, 91, 0.11);
  box-shadow: inset 3px 0 var(--funkollection-secondary);
}

.current-user-row {
  margin-top: 0.75rem;
  border: 1px solid rgba(138, 154, 91, 0.34);
  border-radius: 10px;
}

.rank-marker {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 10px;
  background: #eef0eb;
  color: var(--funkollection-primary);
  font-weight: 900;
}

.rank-marker--1 {
  background: #f3ead0;
}

.rank-marker--2 {
  background: #eceeeb;
}

.rank-marker--3 {
  background: #f1e3d9;
}

.rank-marker--current {
  background: var(--funkollection-secondary);
  color: white;
}

.collector {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.collector-avatar {
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 2.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.collector-avatar--placeholder {
  display: grid;
  place-items: center;
  background: var(--funkollection-primary);
  color: white;
  font-weight: 850;
}

.collector > div {
  display: grid;
  min-width: 0;
}

.collector strong {
  overflow: hidden;
  color: var(--funkollection-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collector span:not(.collector-avatar) {
  color: #747970;
  font-size: 0.7rem;
}

.collector .you-label {
  width: fit-content;
  margin-top: 0.15rem;
  padding: 0.15rem 0.4rem;
  background: rgba(138, 154, 91, 0.17);
  color: var(--funkollection-primary);
}

.pop-total {
  color: var(--funkollection-primary);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.ranking-note {
  display: flex;
  gap: 0.65rem;
  margin-top: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(47, 79, 79, 0.045);
  color: #687069;
}

.ranking-note p {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.55;
}

.error-state {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  color: #7a3526;
}

.error-state h2,
.error-state p {
  margin: 0;
}

.leaderboard-status {
  display: flex;
  min-height: 55vh;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.leaderboard-status .pi {
  color: var(--funkollection-secondary);
  font-size: 1.5rem;
}

.leaderboard-status p {
  margin: 0.2rem 0 0;
  color: #686b64;
}

.paywall-container {
  display: grid;
  min-height: 70vh;
  place-items: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

button:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.36);
  outline-offset: 3px;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 768px) {
  .leaderboard-page {
    padding: 1rem;
  }

  .rank-overview {
    grid-template-columns: 1fr;
  }

  .rank-score {
    max-width: none;
    text-align: left;
  }

  .participation-control,
  .section-header,
  .error-state {
    align-items: stretch;
    flex-direction: column;
  }

  .participation-control {
    display: flex;
  }

  .preference-button {
    width: 100%;
  }

  .error-state {
    display: flex;
  }
}

@media (max-width: 480px) {
  .leaderboard-page {
    padding-inline: 0.75rem;
  }

  .ranking-row,
  .current-user-row {
    grid-template-columns: 2.6rem minmax(0, 1fr);
    gap: 0.65rem;
    padding-inline: 0.4rem;
  }

  .rank-marker {
    width: 2.35rem;
    height: 2.35rem;
  }

  .collector-avatar {
    width: 2.4rem;
    height: 2.4rem;
    flex-basis: 2.4rem;
  }

  .pop-total {
    grid-column: 2;
    text-align: left;
  }
}
</style>
