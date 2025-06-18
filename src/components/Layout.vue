<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const auth = getAuth()
const router = useRouter()

const handleSignOut = () => {
  signOut(auth)
    .then(() => {
      router.push('/') // Redirect to home after sign out
    })
    .catch((error) => {
      alert('Sign out failed: ' + error.message)
    })
}
</script>

<template>
  <div class="flex nav-container" style="position: relative">
    <nav class="flex flex-col w-48">
      <div>
        <h1>Funkollection</h1>
      </div>
      <RouterLink to="/" class="nav-link">Dashboard</RouterLink>
      <RouterLink to="/about" class="nav-link">About</RouterLink>
      <!-- Add more links as needed here -->

      <!-- Spacer pushes the button down-->
      <div class="flex-1"></div>

      <button @click="handleSignOut" class="nav-link">Sign Out</button>
    </nav>
  </div>
  <RouterView />
</template>

<style>
.nav-container {
  padding-right: 3rem;
  text-align: center;
}

.nav-link {
  margin: 2rem;
}

.nav-link:hover {
  cursor: pointer;
}
</style>
