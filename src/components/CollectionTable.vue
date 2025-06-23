<script setup>
import { onMounted, ref } from 'vue'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const funkos = ref([])
const user = ref(null)

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) {
      // 1. Get all Funko IDs from the user's subcollection
      const userFunkosSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
      const funkoIds = userFunkosSnapshot.docs.map((doc) => doc.id)

      // 2. Fetch each FunkoPop's details from the global FunkoPops collection
      const funkoDetails = await Promise.all(
        funkoIds.map(async (id) => {
          const funkoDoc = await getDoc(doc(db, 'FunkoPops', id))
          return funkoDoc.exists() ? { id, ...funkoDoc.data() } : { id }
        }),
      )

      funkos.value = funkoDetails
    }
  })
})
</script>

<template>
  <div class="card">
    <DataTable
      :value="funkos"
      paginator
      :rows="5"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      tableStyle="min-width: 50rem"
    >
      <Column field="id" header="ID" style="width: 25%"></Column>
      <Column field="name" header="Name" style="width: 25%"></Column>
      <Column field="title" header="Title" style="width: 25%"></Column>
      <Column field="series" header="Series" style="width: 25%"></Column>
    </DataTable>
  </div>
</template>

<style>
.p-datatable-header-cell {
  background-color: aqua !important;
}
</style>
