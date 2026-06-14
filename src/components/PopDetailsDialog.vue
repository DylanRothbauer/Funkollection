<script setup>
import { defineProps } from 'vue'
import Dialog from 'primevue/dialog'

defineProps({
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

function closeDialog() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Funko Pop Details"
    :style="{ width: '700px', maxWidth: '98vw' }"
    @update:visible="closeDialog"
  >
    <div v-if="funko" class="flex flex-col items-center p-6 gap-4">
      <!-- Image -->
      <img
        v-if="funko.image"
        :src="funko.image"
        alt="Funko Image"
        class="w-64 h-64 object-cover rounded-xl border shadow-lg mb-2"
      />

      <!-- Name -->
      <div class="text-2xl font-bold text-center" style="font-family: 'Playfair Display', serif; color: var(--funkollection-primary)">
        {{ funko.name }}
      </div>

      <!-- Details Table -->
      <div class="w-full max-w-sm flex flex-col gap-0 rounded-xl overflow-hidden details-table">
        <div class="detail-row detail-row--header">
          <span class="detail-label">Details</span>
          <span class="detail-value"></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Title</span>
          <span class="detail-value">{{ funko.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Series</span>
          <span class="detail-value">{{ funko.series }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ID</span>
          <span class="detail-value">{{ funko.id || '—' }}</span>
        </div>
        <div class="detail-row" v-if="funko.quantity && funko.quantity > 1">
          <span class="detail-label">Quantity</span>
          <span class="detail-value">{{ funko.quantity }}</span>
        </div>
        <div class="detail-row" v-if="funko.purchasePrice !== undefined && funko.purchasePrice !== ''">
          <span class="detail-label">Purchase Price</span>
          <span class="detail-value">${{ Number(funko.purchasePrice).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Stickers -->
      <div v-if="funko.stickers && funko.stickers.length > 0" class="w-full max-w-sm">
        <div class="detail-label mb-2" style="font-size: 0.8rem;">Stickers / Exclusives</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="sticker in funko.stickers"
            :key="sticker"
            class="sticker-badge"
          >
            {{ sticker }}
          </span>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.details-table {
  background: white;
  border: 1px solid rgba(44, 74, 46, 0.15);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(44, 74, 46, 0.08);
  background: #f8fbf7;
}

.detail-row:nth-child(even) {
  background: white;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row--header {
  background: var(--funkollection-secondary);
  color: white;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.detail-row--header .detail-label {
  color: white;
}

.detail-label {
  font-weight: 700;
  color: var(--funkollection-primary);
  font-size: 0.95rem;
}

.detail-value {
  color: var(--funkollection-text);
  text-align: right;
  font-size: 0.95rem;
}

.sticker-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--funkollection-secondary);
  color: white;
}
</style>
