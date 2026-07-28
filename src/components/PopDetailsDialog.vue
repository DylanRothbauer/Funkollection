<script setup>
import { computed } from 'vue'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  funko: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible'])

const formattedPrice = computed(() => {
  const price = Number.parseFloat(props.funko?.purchasePrice)
  if (!Number.isFinite(price)) return null
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(price)
})

const hasStickers = computed(
  () => Array.isArray(props.funko?.stickers) && props.funko.stickers.length > 0,
)

function closeDialog() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :style="{ width: 'min(58rem, calc(100vw - 2rem))' }"
    :contentStyle="{ padding: '0' }"
    @update:visible="closeDialog"
  >
    <template #header>
      <div class="dialog-heading">
        <p>Collection item</p>
        <span>Pop details</span>
      </div>
    </template>

    <article v-if="funko" class="details-layout">
      <section class="image-panel" aria-label="Collectible image">
        <div class="image-frame">
          <img
            :src="funko.image || '/placeholder.svg'"
            :alt="funko.name ? `${funko.name} Funko Pop collectible` : 'Funko Pop collectible'"
          />
        </div>
        <p v-if="!funko.image" class="image-note">
          <i class="pi pi-image" aria-hidden="true"></i>
          No custom image has been added.
        </p>
      </section>

      <section class="details-content">
        <div class="identity">
          <p class="eyebrow">{{ funko.series || 'Series not recorded' }}</p>
          <h2>{{ funko.name || 'Unnamed Pop' }}</h2>
          <p class="title">{{ funko.title || 'No title recorded' }}</p>
        </div>

        <div class="metadata-section">
          <h3>Item information</h3>
          <dl class="metadata-list">
            <div>
              <dt>Box number</dt>
              <dd>{{ funko.id || 'Not recorded' }}</dd>
            </div>
            <div>
              <dt>Series</dt>
              <dd>{{ funko.series || 'Not recorded' }}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{{ funko.quantity || 1 }}</dd>
            </div>
          </dl>
        </div>

        <div class="collection-summary">
          <div>
            <span class="summary-icon">
              <i class="pi pi-wallet" aria-hidden="true"></i>
            </span>
            <div>
              <span>Recorded purchase price</span>
              <strong>{{ formattedPrice || 'Not recorded' }}</strong>
            </div>
          </div>
          <p>This is the purchase price saved in your collection, not a live market valuation.</p>
        </div>

        <div v-if="hasStickers" class="metadata-section">
          <h3>Stickers and exclusives</h3>
          <ul class="sticker-list">
            <li v-for="sticker in funko.stickers" :key="sticker">
              <i class="pi pi-tag" aria-hidden="true"></i>
              {{ sticker }}
            </li>
          </ul>
        </div>

        <p v-else class="no-stickers">
          <i class="pi pi-tag" aria-hidden="true"></i>
          No stickers or exclusives are recorded for this Pop.
        </p>
      </section>
    </article>

    <div v-else class="missing-item" role="status">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      <h2>Pop details unavailable</h2>
      <p>This collection item could not be displayed.</p>
    </div>

    <template #footer>
      <button type="button" class="close-action" @click="closeDialog">Close details</button>
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-heading p,
.dialog-heading span {
  margin: 0;
}

.dialog-heading p {
  color: var(--funkollection-secondary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.dialog-heading span {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 750;
}

.details-layout {
  display: grid;
  grid-template-columns: minmax(18rem, 0.9fr) minmax(0, 1.1fr);
  min-height: 32rem;
}

.image-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1.5rem, 4vw, 3rem);
  background: radial-gradient(circle at center, rgba(138, 154, 91, 0.12), transparent 70%), #f6f3e8;
}

.image-frame {
  display: grid;
  width: 100%;
  max-width: 22rem;
  aspect-ratio: 1;
  margin: 0 auto;
  padding: 1.25rem;
  place-items: center;
  border: 1px solid rgba(47, 79, 79, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.image-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  color: #73776e;
  font-size: 0.78rem;
  text-align: center;
}

.details-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.4rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background: white;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.identity h2 {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  line-height: 1.08;
}

.title {
  margin: 0.45rem 0 0;
  color: #686c64;
  font-size: 1rem;
}

.metadata-section {
  padding-top: 1.1rem;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.metadata-section h3 {
  margin: 0 0 0.75rem;
  color: var(--funkollection-primary);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metadata-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.metadata-list div {
  min-width: 0;
}

.metadata-list dt {
  color: #787b73;
  font-size: 0.72rem;
}

.metadata-list dd {
  overflow-wrap: anywhere;
  margin: 0.15rem 0 0;
  color: var(--funkollection-text);
  font-weight: 750;
}

.collection-summary {
  padding: 1rem;
  border: 1px solid rgba(138, 154, 91, 0.28);
  border-radius: 12px;
  background: rgba(138, 154, 91, 0.08);
}

.collection-summary > div {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-icon {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  border-radius: 10px;
  background: var(--funkollection-secondary);
  color: white;
}

.collection-summary > div > div {
  display: flex;
  flex-direction: column;
}

.collection-summary span {
  color: #676b63;
  font-size: 0.72rem;
}

.collection-summary strong {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.4rem;
}

.collection-summary p {
  margin: 0.65rem 0 0;
  color: #74786e;
  font-size: 0.75rem;
}

.sticker-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sticker-list li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid rgba(47, 79, 79, 0.14);
  border-radius: 8px;
  background: #fafaf7;
  color: #5f645c;
  font-size: 0.76rem;
  font-weight: 650;
}

.no-stickers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #7a7d75;
  font-size: 0.8rem;
}

.missing-item {
  display: grid;
  min-height: 22rem;
  padding: 2rem;
  place-items: center;
  align-content: center;
  color: #72766e;
  text-align: center;
}

.missing-item .pi {
  color: var(--funkollection-secondary);
  font-size: 1.8rem;
}

.missing-item h2,
.missing-item p {
  margin: 0;
}

.missing-item h2 {
  margin-top: 0.7rem;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

.close-action {
  min-height: 42px;
  padding: 0.55rem 0.9rem;
  border: 1px solid rgba(47, 79, 79, 0.18);
  border-radius: 8px;
  background: white;
  color: var(--funkollection-primary);
  font-weight: 750;
  cursor: pointer;
}

.close-action:hover {
  background: rgba(138, 154, 91, 0.08);
}

.close-action:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.3);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .details-layout {
    grid-template-columns: 1fr;
  }

  .image-panel {
    padding: 1.25rem;
  }

  .image-frame {
    max-width: 14rem;
  }

  .details-content {
    padding: 1.25rem;
  }

  .metadata-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .metadata-list {
    grid-template-columns: 1fr;
  }
}
</style>
