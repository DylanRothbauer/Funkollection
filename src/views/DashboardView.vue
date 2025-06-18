<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
const user = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (firebaseUser) => {
    console.log(firebaseUser)
    user.value = firebaseUser
  })
})
</script>

<template>
  <div class="w-screen h-screen bg-gray-900">
    <header class="flex items-center justify-between p-4 bg-white">
      <h1>Welcome back, {{ user.displayName }}</h1>
    </header>
    <div v-if="user" class="flex items-center gap-4 mt-4">
      <img
        v-if="user.photoURL"
        :src="user.photoURL"
        :alt="user.displayName"
        class="rounded-full w-16 h-16 object-cover border-2 border-primary"
      />
      <span class="text-2xl font-bold">Welcome, {{ user.displayName }}!</span>
    </div>
  </div>
</template>

<style></style>
