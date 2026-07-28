<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '@/composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const mostValuableFunkos = computed(() =>
  [...funkos.value]
    .map((funko) => ({ ...funko, numericPrice: Number.parseFloat(funko.purchasePrice) }))
    .filter((funko) => Number.isFinite(funko.numericPrice))
    .sort((a, b) => b.numericPrice - a.numericPrice)
    .slice(0, 3),
)

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}
</script>

<template>
  <article class="dashboard-card list-card" aria-labelledby="valuable-pops-title">
    <header class="card-header">
      <div>
        <p class="card-kicker">Top recorded prices</p>
        <h2 id="valuable-pops-title">Most valuable Pops</h2>
      </div>
      <span class="pi pi-sparkles card-icon" aria-hidden="true"></span>
    </header>

    <div v-if="loading" class="skeleton-list" aria-label="Loading valuable Pops">
      <span v-for="index in 3" :key="index"></span>
    </div>

    <div v-else-if="mostValuableFunkos.length === 0" class="empty-state">
      <span class="pi pi-tag" aria-hidden="true"></span>
      <p>No purchase prices yet.</p>
      <small>Add prices to see your top recorded values.</small>
    </div>

    <ol v-else class="item-list">
      <li v-for="(funko, index) in mostValuableFunkos" :key="funko.docId || funko.id">
        <span class="rank" :aria-label="`Rank ${index + 1}`">{{ index + 1 }}</span>
        <img
          :src="funko.image || '/placeholder.svg'"
          :alt="funko.name ? `${funko.name} collectible` : 'Funko Pop collectible'"
        />
        <div class="item-copy">
          <strong>{{ funko.name || 'Unnamed Pop' }}</strong>
          <span>{{ funko.series || 'Series not recorded' }}</span>
        </div>
        <span class="price">{{ formatCurrency(funko.numericPrice) }}</span>
      </li>
    </ol>
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

.card-icon {
  color: var(--funkollection-secondary);
  font-size: 1.2rem;
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
  grid-template-columns: 1.6rem 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.rank {
  color: var(--funkollection-secondary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 700;
  text-align: center;
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

.item-copy span {
  color: #777a72;
  font-size: 0.78rem;
}

.price {
  color: var(--funkollection-primary);
  font-size: 0.9rem;
  font-weight: 800;
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
    grid-template-columns: 1.4rem 2.75rem minmax(0, 1fr);
  }

  .price {
    grid-column: 3;
  }
}
</style>
