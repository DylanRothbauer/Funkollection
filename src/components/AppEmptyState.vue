<script setup>
defineProps({
  icon: { type: String, default: 'pi-inbox' },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <div class="app-empty-state">
    <span :class="['pi', icon]" aria-hidden="true"></span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app-empty-state {
  display: grid;
  min-height: 14rem;
  padding: 2rem;
  place-items: center;
  align-content: center;
  color: #6e7269;
  text-align: center;
}

.pi {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  margin-bottom: 0.75rem;
  place-items: center;
  border-radius: 12px;
  background: rgba(138, 154, 91, 0.13);
  color: var(--funkollection-secondary);
  font-size: 1.4rem;
}

h3 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.3rem;
}

p {
  max-width: 28rem;
  margin: 0.35rem 0 0;
}

.empty-action {
  margin-top: 1rem;
}
</style>
