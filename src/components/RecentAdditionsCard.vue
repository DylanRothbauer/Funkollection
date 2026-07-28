<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserFunkos } from '@/composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const recentFunkos = computed(() =>
  [...funkos.value]
    .filter((funko) => funko.addedAt)
    .sort((a, b) => {
      const aTime = a.addedAt?.toMillis?.() || new Date(a.addedAt).getTime()
      const bTime = b.addedAt?.toMillis?.() || new Date(b.addedAt).getTime()
      return bTime - aTime
    })
    .slice(0, 3),
)

function formatDate(date) {
  if (!date) return 'Unknown date'
  const parsedDate = date.toDate ? date.toDate() : new Date(date)
  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <article class="dashboard-card list-card" aria-labelledby="recent-additions-title">
    <header class="card-header">
      <div>
        <p class="card-kicker">Latest activity</p>
        <h2 id="recent-additions-title">Recent additions</h2>
      </div>
      <RouterLink class="text-link" to="/collection">View all</RouterLink>
    </header>

    <div v-if="loading" class="skeleton-list" aria-label="Loading recent additions">
      <span v-for="index in 3" :key="index"></span>
    </div>

    <div v-else-if="recentFunkos.length === 0" class="empty-state">
      <span class="pi pi-clock" aria-hidden="true"></span>
      <p>No dated additions yet.</p>
      <small>Newly added Pops will appear here.</small>
    </div>

    <ul v-else class="item-list">
      <li v-for="funko in recentFunkos" :key="funko.docId">
        <img
          :src="funko.image || '/placeholder.svg'"
          :alt="funko.name ? `${funko.name} collectible` : 'Funko Pop collectible'"
        />
        <div class="item-copy">
          <strong>{{ funko.name || 'Unnamed Pop' }}</strong>
          <span>{{ funko.series || 'Series not recorded' }}</span>
        </div>
        <time>{{ formatDate(funko.addedAt) }}</time>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.list-card {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
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

.text-link {
  color: var(--funkollection-primary);
  font-size: 0.85rem;
  font-weight: 700;
  text-underline-offset: 3px;
}

.item-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item-list li {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.item-list img {
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 8px;
  background: #f7f5ed;
  object-fit: contain;
}

.item-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.item-copy strong,
.item-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-copy strong {
  color: var(--funkollection-text);
}

.item-copy span,
time {
  color: #777a72;
  font-size: 0.78rem;
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

.skeleton-list {
  display: grid;
  gap: 0.75rem;
}

.skeleton-list span {
  height: 3.5rem;
  border-radius: 8px;
  background: #eceee8;
}

@media (max-width: 420px) {
  .item-list li {
    grid-template-columns: 2.75rem minmax(0, 1fr);
  }

  time {
    grid-column: 2;
  }
}
</style>
