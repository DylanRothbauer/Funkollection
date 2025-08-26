<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '@/composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

// Sort and limit to latest 3 additions
const recentFunkos = computed(() => {
  return [...funkos.value]
    .filter((f) => f.addedAt) // skip if no date
    .sort((a, b) => {
      const aTime = a.addedAt?.toMillis?.() || new Date(a.addedAt).getTime()
      const bTime = b.addedAt?.toMillis?.() || new Date(b.addedAt).getTime()
      return bTime - aTime
    })
    .slice(0, 3)
})

// Date formatting helper
function formatDate(date) {
  if (!date) return 'Unknown date'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="pop-card">
    <h2 class="font-semibold text-lg text-gray-500 mb-4">Recent Additions</h2>

    <div v-if="loading" class="text-gray-400 text-sm">Loading...</div>

    <div v-else-if="recentFunkos.length === 0" class="text-gray-400 text-sm">
      No recent additions yet.
    </div>

    <ul v-else class="flex flex-col gap-3">
      <li v-for="funko in recentFunkos" :key="funko.id" class="flex items-center gap-3">
        <img
          :src="funko.image || '/placeholder.png'"
          alt="Funko"
          class="w-12 h-12 object-cover rounded border"
        />
        <div>
          <div class="font-medium text-gray-800">{{ funko.name || 'Unnamed Pop' }}</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(funko.addedAt) }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
