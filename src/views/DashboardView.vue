<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
const user = ref(null)

// onMounted(() => {
//   onAuthStateChanged(auth, (firebaseUser) => {
//     console.log(firebaseUser)
//     user.value = firebaseUser
//   })
// })
</script>

<template>
  <div>
    <header class="flex items-center justify-between p-4">
      <h1>Welcome back, Signed in User</h1>
    </header>
  </div>
</template>

<style></style>
