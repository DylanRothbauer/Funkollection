<script setup>
import { computed, ref } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()
const showAll = ref(false)
const TOP_COUNT = 6

const hasFunkos = computed(() => Array.isArray(funkos.value) && funkos.value.length > 0)

const stickerBreakdown = computed(() => {
  const counts = {}
  funkos.value.forEach((pop) => {
    if (!Array.isArray(pop.stickers)) return
    pop.stickers.forEach((sticker) => {
      counts[sticker] = (counts[sticker] || 0) + 1
    })
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

const displayedStickers = computed(() =>
  showAll.value ? stickerBreakdown.value : stickerBreakdown.value.slice(0, TOP_COUNT),
)

const totalStickered = computed(
  () => funkos.value.filter((pop) => Array.isArray(pop.stickers) && pop.stickers.length > 0).length,
)

const highestCount = computed(() => stickerBreakdown.value[0]?.[1] || 1)

function percentage(count) {
  return `${Math.max(8, (count / highestCount.value) * 100)}%`
}
</script>

<template>
  <article class="dashboard-card sticker-card" aria-labelledby="sticker-title">
    <header class="card-header">
      <div>
        <p class="card-kicker">Exclusives and variants</p>
        <h2 id="sticker-title">Sticker breakdown</h2>
        <p class="card-summary">{{ totalStickered }} Pops have at least one sticker</p>
      </div>
      <span class="pi pi-tags card-icon" aria-hidden="true"></span>
    </header>

    <div v-if="loading" class="sticker-skeleton" aria-label="Loading sticker breakdown">
      <span v-for="index in 4" :key="index"></span>
    </div>

    <div v-else-if="!hasFunkos" class="empty-state">
      <span class="pi pi-tags" aria-hidden="true"></span>
      <p>No collection data yet.</p>
      <small>Your stickers and exclusives will appear here.</small>
    </div>

    <div v-else-if="stickerBreakdown.length === 0" class="empty-state">
      <span class="pi pi-tag" aria-hidden="true"></span>
      <p>No stickers tracked yet.</p>
      <small>Add sticker details to your Pops to build this breakdown.</small>
    </div>

    <template v-else>
      <ul class="sticker-grid">
        <li v-for="[sticker, count] in displayedStickers" :key="sticker">
          <div class="sticker-row">
            <span>{{ sticker }}</span>
            <strong>{{ count }}</strong>
          </div>
          <div class="bar-track" aria-hidden="true">
            <span :style="{ width: percentage(count) }"></span>
          </div>
        </li>
      </ul>

      <button
        v-if="stickerBreakdown.length > TOP_COUNT"
        class="show-more"
        type="button"
        :aria-expanded="showAll"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show fewer stickers' : `Show ${stickerBreakdown.length - TOP_COUNT} more` }}
        <span
          :class="['pi', showAll ? 'pi-chevron-up' : 'pi-chevron-down']"
          aria-hidden="true"
        ></span>
      </button>
    </template>
  </article>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.card-kicker {
  margin: 0 0 0.1rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
}

.card-summary {
  margin: 0.2rem 0 0;
  color: #74786e;
  font-size: 0.85rem;
}

.card-icon {
  color: var(--funkollection-secondary);
  font-size: 1.2rem;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sticker-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.35rem;
  color: #5e625a;
  font-size: 0.86rem;
}

.sticker-row strong {
  color: var(--funkollection-primary);
}

.bar-track {
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e8eae4;
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--funkollection-secondary);
}

.show-more {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  margin-top: 1.25rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba(47, 79, 79, 0.18);
  border-radius: 8px;
  background: transparent;
  color: var(--funkollection-primary);
  font-weight: 700;
  cursor: pointer;
}

.show-more:hover {
  background: rgba(138, 154, 91, 0.08);
}

.show-more:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.3);
  outline-offset: 2px;
}

.empty-state {
  display: grid;
  min-height: 10rem;
  place-items: center;
  align-content: center;
  color: #74786e;
  text-align: center;
}

.empty-state .pi {
  margin-bottom: 0.5rem;
  color: var(--funkollection-secondary);
  font-size: 1.5rem;
}

.empty-state p,
.empty-state small {
  margin: 0;
}

.sticker-skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
}

.sticker-skeleton span {
  height: 2.2rem;
  border-radius: 8px;
  background: #eceee8;
}

@media (max-width: 620px) {
  .sticker-grid,
  .sticker-skeleton {
    grid-template-columns: 1fr;
  }
}
</style>
