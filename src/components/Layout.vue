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
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <button @click="handleSignOut" class="signin">Sign Out</button>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style></style>
