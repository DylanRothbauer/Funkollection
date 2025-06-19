<script setup>
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const funkos = ref([])

onMounted(async () => {
  const querySnapshot = await getDocs(collection(db, 'FunkoPops'))
  funkos.value = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(), // spread all the fields from the document
  }))
})
</script>

<template>
  <div class="card">
    <DataTable :value="funkos" stripedRows tableStyle="min-width: 50rem">
      <Column field="ID" header="ID"></Column>
      <Column field="Name" header="Name"></Column>
      <Column field="Title" header="Title"></Column>
      <Column field="Category" header="Category"></Column>
    </DataTable>
  </div>
</template>

<style>
.p-datatable-header-cell {
  background-color: aqua !important;
}
</style>
