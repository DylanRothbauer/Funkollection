<script setup>
import { ref } from 'vue'
import { auth, db } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc } from 'firebase/firestore'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const user = ref(null)
const funkoName = ref('')
const funkoTitle = ref('')
const funkoSeries = ref('')
const funkoID = ref('')
const error = ref('')
const success = ref('')

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
})

const addFunkoPop = async () => {
  if (!user.value) {
    error.value = 'You must be signed in.'
    return
  }
  try {
    // 1. Check if FunkoPop exists in global collection
    const funkoDocRef = doc(db, 'FunkoPops', funkoID.value)
    const funkoDocSnap = await getDoc(funkoDocRef)
    if (!funkoDocSnap.exists()) {
      await setDoc(funkoDocRef, {
        name: funkoName.value,
        title: funkoTitle.value,
        series: funkoSeries.value,
        id: funkoID.value,
        createdAt: new Date(),
      })
    }

    // 2. Add or increment in the user's collection
    const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', funkoID.value)
    const userFunkoSnap = await getDoc(userFunkoRef)
    if (userFunkoSnap.exists()) {
      // Increment quantity
      const prevQty = userFunkoSnap.data().quantity || 1
      await updateDoc(userFunkoRef, {
        quantity: prevQty + 1,
        lastAddedAt: new Date(),
      })
    } else {
      // Set initial quantity to 1
      await setDoc(userFunkoRef, {
        quantity: 1,
        addedAt: new Date(),
      })
    }

    funkoName.value = ''
    funkoTitle.value = ''
    funkoSeries.value = ''
    funkoID.value = ''

    success.value = 'Funko Pop added!'
    error.value = ''
  } catch (e) {
    error.value = 'Failed to add Funko Pop.'
    success.value = ''
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-8">
    <h2 class="text-2xl font-bold mb-4">Add a Funko Pop</h2>
    <form @submit.prevent="addFunkoPop" class="flex flex-col gap-4">
      <input v-model="funkoName" placeholder="Name" class="p-2 border rounded" required />
      <input v-model="funkoTitle" placeholder="Title" class="p-2 border rounded" required />
      <input v-model="funkoSeries" placeholder="Series" class="p-2 border rounded" />
      <input v-model="funkoID" placeholder="ID" class="p-2 border rounded" required />
      <button type="submit" class="p-2 bg-blue-500 text-white rounded">Add Funko Pop</button>
      <div v-if="success" class="text-green-600">{{ success }}</div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
    </form>
  </div>
</template>
