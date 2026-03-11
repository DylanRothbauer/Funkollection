<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const hasFunkos = computed(() => Array.isArray(funkos?.value) && funkos.value.length > 0)

const stickerBreakdown = computed(() => {
  const counts = {}
  funkos.value?.forEach((pop) => {
    if (Array.isArray(pop.stickers)) {
      pop.stickers.forEach((sticker) => {
        counts[sticker] = (counts[sticker] || 0) + 1
      })
    }
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
})

const totalStickered = computed(() => {
  return funkos.value?.filter(p => Array.isArray(p.stickers) && p.stickers.length > 0).length || 0
})

const stickerColors = {
  'Chase': '#F59E0B',
  'Target Exclusive': '#EF4444',
  'Walmart Exclusive': '#3B82F6',
  'GameStop Exclusive': '#8B5CF6',
  'Hot Topic Exclusive': '#EC4899',
  'Amazon Exclusive': '#F97316',
  'BoxLunch Exclusive': '#14B8A6',
  'FYE Exclusive': '#6366F1',
  'Glow in the Dark': '#10B981',
  'Flocked': '#A78BFA',
  'Metallic': '#6B7280',
  'SDCC Exclusive': '#0EA5E9',
  'NYCC Exclusive': '#84CC16',
  'Entertainment Earth Exclusive': '#F43F5E',
  'Specialty Series': '#8B5CF6',
}

function getColor(sticker) {
  return stickerColors[sticker] || '#8a9a5b'
}
</script>

<template>
  <div
    class="pop-card shadow rounded-lg bg-white flex flex-col py-8 px-6"
    style="min-width: 320px; min-height: 340px"
  >
    <div class="font-semibold text-lg text-gray-500 mb-1" style="letter-spacing: 0.03em">
      Sticker Breakdown
    </div>
    <div class="text-sm text-gray-400 mb-4">{{ totalStickered }} Pops with stickers</div>

    <div v-if="loading" class="text-2xl text-gray-400">...</div>

    <div v-else-if="!hasFunkos" class="text-gray-400 text-lg">
      No Pops in your collection yet.
    </div>

    <div v-else-if="stickerBreakdown.length === 0" class="text-gray-400 text-lg">
      No stickers tracked yet.
    </div>

    <div v-else class="flex flex-col gap-2 w-full">
      <div
        v-for="([sticker, count]) in stickerBreakdown"
        :key="sticker"
        class="flex items-center justify-between py-2 px-3 rounded-lg"
        style="background: #f9f9f9"
      >
        <div class="flex items-center gap-2">
          <span
            :style="{
              background: getColor(sticker),
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              display: 'inline-block',
              flexShrink: '0'
            }"
          ></span>
          <span class="text-gray-700 font-medium text-sm">{{ sticker }}</span>
        </div>
        <span
          class="font-bold text-base px-2 py-0.5 rounded-full text-white"
          :style="{ background: getColor(sticker) }"
        >
          {{ count }}
        </span>
      </div>
    </div>

    <div class="text-sm text-gray-400 mt-4 text-center">
      Breakdown of your stickers & exclusives
    </div>
  </div>
</template>