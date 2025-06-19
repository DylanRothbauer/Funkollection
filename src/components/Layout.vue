<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

// const auth = getAuth()
// const router = useRouter()

// const handleSignOut = () => {
//   signOut(auth)
//     .then(() => {
//       router.push('/') // Redirect to home after sign out
//     })
//     .catch((error) => {
//       alert('Sign out failed: ' + error.message)
//     })
// }
</script>

<template>
  <div class="flex w-screen h-screen">
    <div class="flex nav-container">
      <nav class="flex flex-col w-48">
        <div>
          <h1 class="text-2xl">Funkollection</h1>
        </div>
        <RouterLink to="/dashboard" class="nav-link text-xl" active-class="router-link-active"
          >Dashboard</RouterLink
        >
        <RouterLink to="/collection" class="nav-link text-xl" active-class="router-link-active"
          >Collection</RouterLink
        >
        <RouterLink to="/about" class="nav-link text-xl" active-class="router-link-active"
          >About</RouterLink
        >
        <!-- Add more links as needed here -->

        <!-- Spacer pushes the button down-->
        <div class="flex-1"></div>

        <button class="nav-link">Sign Out</button>
      </nav>
    </div>

    <div class="flex-1 main-content">
      <RouterView />
    </div>
  </div>
</template>

<style>
.nav-container {
  padding-right: 3rem;
  text-align: center;
  color: var(--funkollection-soft-white);
  background-color: var(--funkollection-primary);
}

.nav-link {
  margin: 1rem;
}

.nav-link:hover {
  cursor: pointer;
}

.router-link-active {
  background-color: var(--funkollection-secondary);
  font-weight: bold;
  border-radius: 0.375rem; /* rounded-md */
}

.main-content {
  background-color: var(--funkollection-background);
}
</style>
