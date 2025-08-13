<script setup>
import { defineProps, defineEmits } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  favorites: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['view-funko'])

function viewFunko(funko) {
  emit('view-funko', funko)
}
</script>

<template>
  <div>
    <div v-if="loading" class="p-4">Loading favorites...</div>
    <div v-else>
      <div v-if="favorites.length === 0" class="p-4">No favorites yet.</div>
      <div class="funkotable-wrapper flat-table">
        <table class="funkotable flat-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Title</th>
              <th>Series</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="funko in favorites" :key="funko.id" class="funkotable-row">
              <td>
                <img
                  v-if="funko.image"
                  :src="funko.image"
                  alt="Funko Image"
                  class="w-16 h-16 object-cover rounded"
                />
              </td>
              <td>{{ funko.name }}</td>
              <td>{{ funko.title }}</td>
              <td>{{ funko.series }}</td>
              <td>
                <Button
                  icon="pi pi-eye"
                  outlined
                  rounded
                  severity="info"
                  @click="viewFunko(funko)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.funkotable-wrapper.flat-table {
  background: none;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}
.funkotable.flat-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}
.funkotable.flat-table th,
.funkotable.flat-table td {
  padding: 0.6rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.funkotable.flat-table th {
  background: none;
  font-weight: 600;
  font-size: 1rem;
  color: #222;
  border-top: none;
}
.funkotable-row:hover {
  background: #f3f4f6;
}
.funkotable.flat-table td {
  font-size: 1rem;
  color: #333;
  background: transparent;
}
</style>
