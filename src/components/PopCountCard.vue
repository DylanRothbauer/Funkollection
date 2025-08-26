<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const popCount = computed(() => funkos.value.length)
</script>

<template>
  <div
    class="pop-card shadow rounded-lg bg-white flex flex-col items-center justify-center py-8 px-6"
    style="min-width: 260px"
  >
    <div class="text-lg font-semibold text-gray-500 mb-2" style="letter-spacing: 0.03em">
      Collection Size
    </div>
    <div class="text-6xl font-extrabold mb-2" style="color: var(--funkollection-secondary)">
      {{ loading.value ? '...' : popCount }}
    </div>
    <div class="text-lg text-gray-600">Number of Funko Pops you own</div>
  </div>
</template>

<style scoped></style>
