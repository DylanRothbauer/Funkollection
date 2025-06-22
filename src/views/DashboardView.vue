<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
const user = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
  })
})
</script>

<template>
  <div>
    <header class="flex items-center justify-between p-4" style="background-color: white">
      <h1>Welcome back, {{ user && user.displayName ? user.displayName : 'Signed in User' }}</h1>
    </header>
  </div>
</template>

<style></style>
