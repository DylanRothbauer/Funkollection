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
      <nav class="flex flex-col w-48 bg-gray-200">
        <div>
          <h1>Funkollection</h1>
        </div>
        <RouterLink to="/dashboard" class="nav-link" active-class="router-link-active"
          >Dashboard</RouterLink
        >
        <RouterLink to="/collection" class="nav-link" active-class="router-link-active"
          >Collection</RouterLink
        >
        <RouterLink to="/about" class="nav-link" active-class="bg-blue-500 text-white font-bold"
          >About</RouterLink
        >
        <!-- Add more links as needed here -->

        <!-- Spacer pushes the button down-->
        <div class="flex-1"></div>

        <button class="nav-link">Sign Out</button>
      </nav>
    </div>

    <div class="flex-1">
      <RouterView />
    </div>
  </div>
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

.router-link-active {
  background-color: #3b82f6; /* Tailwind blue-500 */
  color: #fff;
  font-weight: bold;
  border-radius: 0.375rem; /* rounded-md */
}
</style>
