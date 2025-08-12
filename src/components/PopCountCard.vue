<script setup>
import { computed } from 'vue'
import { useUserFunkos } from '../composables/useUserFunkos'

const { funkos, loading } = useUserFunkos()

const popCount = computed(() => funkos.value.length)
</script>

<template>
  <div
    class="pop-count-card shadow rounded-lg bg-white flex flex-col items-center justify-center py-8 px-6"
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

<style scoped>
.pop-count-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #ececec;
  margin-bottom: 1.5rem;
  min-width: 260px;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.pop-count-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.02);
}
</style>
