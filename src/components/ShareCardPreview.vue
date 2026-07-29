<script setup>
import { computed, ref } from 'vue'
import { formatRecordedValue } from '../utils/collectionStats.js'
import { SHARE_CARD_FORMAT, exportSvgElementToPng, safeCollectorName } from '../utils/shareCard.js'

const props = defineProps({
  stats: { type: Object, required: true },
  displayName: { type: String, default: '' },
  attribution: { type: String, required: true },
  options: { type: Object, required: true },
})

const cardSvg = ref(null)
const palette = computed(() =>
  props.options.theme === 'dark'
    ? {
        background: '#263f3f',
        surface: '#315050',
        surfaceAlt: '#3a5958',
        text: '#fffdf8',
        muted: '#c8d1ca',
        accent: '#b9c58b',
        line: '#52706e',
      }
    : {
        background: '#faf3e0',
        surface: '#fffdf8',
        surfaceAlt: '#f1ecd9',
        text: '#2f4f4f',
        muted: '#68716b',
        accent: '#8a9a5b',
        line: '#d9ddcd',
      },
)
const cardTitle = computed(() =>
  props.options.showDisplayName
    ? `${safeCollectorName(props.displayName)}'s collection`
    : 'My Funkollection',
)
const visibleStats = computed(() => {
  const result = [
    { label: 'Pops collected', value: props.stats.totalPops.toLocaleString('en-US') },
    { label: 'Favorites', value: props.stats.favoriteCount.toLocaleString('en-US') },
    { label: 'Series', value: props.stats.seriesCount.toLocaleString('en-US') },
    { label: 'Badges earned', value: props.stats.earnedBadgeCount.toLocaleString('en-US') },
  ]
  if (props.options.showRecordedValue) {
    result[3] = {
      label: 'Recorded purchase value',
      value: formatRecordedValue(props.stats.recordedValue),
    }
  }
  return result
})
const previewDescription = computed(() => {
  const fourthMetric = props.options.showRecordedValue
    ? `${formatRecordedValue(props.stats.recordedValue)} in recorded purchase value`
    : `${props.stats.earnedBadgeCount} badges earned`
  return `${cardTitle.value}. ${props.stats.totalPops} Pops, ${props.stats.favoriteCount} favorites, ${props.stats.seriesCount} series, and ${fourthMetric}.`
})

function clippedText(value, maxLength = 31) {
  const text = String(value || '')
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

function exportPng() {
  return exportSvgElementToPng(cardSvg.value)
}

defineExpose({ exportPng })
</script>

<template>
  <div class="share-card-frame">
    <svg
      ref="cardSvg"
      class="share-card-svg"
      :viewBox="`0 0 ${SHARE_CARD_FORMAT.width} ${SHARE_CARD_FORMAT.height}`"
      role="img"
      :aria-label="previewDescription"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1080" height="1080" :fill="palette.background" />
      <circle cx="1000" cy="70" r="230" :fill="palette.accent" opacity="0.14" />
      <circle cx="70" cy="1030" r="180" :fill="palette.accent" opacity="0.1" />
      <rect x="60" y="60" width="960" height="960" rx="38" :fill="palette.surface" />
      <rect x="60" y="60" width="14" height="960" rx="7" :fill="palette.accent" />

      <rect x="112" y="112" width="66" height="66" rx="18" :fill="palette.text" />
      <text
        x="145"
        y="160"
        text-anchor="middle"
        :fill="palette.surface"
        font-family="Georgia, serif"
        font-size="44"
        font-weight="700"
      >
        F
      </text>
      <text
        x="200"
        y="140"
        :fill="palette.text"
        font-family="Arial, sans-serif"
        font-size="22"
        font-weight="700"
        letter-spacing="3"
      >
        FUNKOLLECTION
      </text>
      <text x="200" y="170" :fill="palette.muted" font-family="Arial, sans-serif" font-size="18">
        COLLECTION SNAPSHOT
      </text>

      <text
        x="112"
        y="285"
        :fill="palette.text"
        font-family="Georgia, serif"
        font-size="62"
        font-weight="700"
      >
        {{ clippedText(cardTitle, 29) }}
      </text>
      <text x="112" y="334" :fill="palette.muted" font-family="Arial, sans-serif" font-size="24">
        A collection worth remembering, one Pop at a time.
      </text>

      <g v-for="(stat, index) in visibleStats" :key="stat.label">
        <rect
          :x="112 + (index % 2) * 442"
          :y="402 + Math.floor(index / 2) * 190"
          width="412"
          height="160"
          rx="24"
          :fill="palette.surfaceAlt"
          :stroke="palette.line"
          stroke-width="2"
        />
        <text
          :x="142 + (index % 2) * 442"
          :y="456 + Math.floor(index / 2) * 190"
          :fill="palette.muted"
          font-family="Arial, sans-serif"
          font-size="19"
          font-weight="700"
          letter-spacing="1.8"
        >
          {{ stat.label.toUpperCase() }}
        </text>
        <text
          :x="142 + (index % 2) * 442"
          :y="522 + Math.floor(index / 2) * 190"
          :fill="palette.text"
          font-family="Georgia, serif"
          :font-size="stat.value.length > 12 ? 42 : 54"
          font-weight="700"
        >
          {{ stat.value }}
        </text>
      </g>

      <line x1="112" y1="814" x2="966" y2="814" :stroke="palette.line" stroke-width="2" />
      <g v-if="options.showTopSeries && stats.topSeries">
        <text
          x="112"
          y="863"
          :fill="palette.muted"
          font-family="Arial, sans-serif"
          font-size="19"
          font-weight="700"
          letter-spacing="1.8"
        >
          MOST COLLECTED SERIES
        </text>
        <text
          x="112"
          y="918"
          :fill="palette.text"
          font-family="Georgia, serif"
          font-size="38"
          font-weight="700"
        >
          {{ clippedText(stats.topSeries, 39) }}
        </text>
      </g>
      <text
        v-else
        x="112"
        y="888"
        :fill="palette.muted"
        font-family="Georgia, serif"
        font-size="30"
        font-style="italic"
      >
        Collected with care. Organized with Funkollection.
      </text>

      <text x="112" y="977" :fill="palette.muted" font-family="Arial, sans-serif" font-size="18">
        Created with Funkollection
      </text>
      <text
        x="966"
        y="977"
        text-anchor="end"
        :fill="palette.text"
        font-family="Arial, sans-serif"
        font-size="18"
        font-weight="700"
      >
        {{ attribution }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.share-card-frame {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(47, 79, 79, 0.14);
  border-radius: 16px;
  background: #e9e5d8;
  box-shadow: 0 12px 32px rgba(47, 79, 79, 0.12);
}

.share-card-svg {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
}
</style>
