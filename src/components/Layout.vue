<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import router from '@/router'

const isLoggedIn = ref(false)
let auth

onMounted(() => {
  auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true
    } else {
      isLoggedIn.value = false
    }
  })
})
const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push('/')
  })
}
</script>

<template>
  <div class="flex w-screen h-screen">
    <div class="flex nav-container">
      <nav class="flex flex-col w-48">
        <div>
          <h1 class="playfair-display-hometitle nav-head font-bold text-3xl flex-1 items-center">
            Funkollection
          </h1>
        </div>
        <div class="margin-vertical">
          <RouterLink
            to="/dashboard"
            class="flex nav-link text-xl items-center"
            active-class="router-link-active"
          >
            <i class="pi pi-th-large pr-3 w-3 nav-icon"></i>
            <span class="ml-2 flex-1">Dashboard</span>
          </RouterLink>
        </div>
        <div class="margin-vertical">
          <RouterLink
            to="/collection"
            class="flex nav-link text-xl items-center"
            active-class="router-link-active"
          >
            <i class="pi pi-box pr-3 w-3 nav-icon"></i>
            <span class="ml-2 flex-1">Collection</span>
          </RouterLink>
        </div>

        <div class="margin-vertical">
          <RouterLink
            to="/about"
            class="flex nav-link text-xl items-center"
            active-class="router-link-active"
          >
            <i class="pi pi-box pr-3 w-3 nav-icon"></i>
            <span class="ml-2 flex-1">About</span>
          </RouterLink>
        </div>

        <div class="margin-vertical">
          <RouterLink
            to="/favorites"
            class="flex nav-link text-xl items-center"
            active-class="router-link-active"
          >
            <i class="pi pi-heart pr-3 w-3 nav-icon"></i>
            <span class="ml-2 flex-1">Favorites</span>
          </RouterLink>
        </div>

        <!-- Add more links as needed here -->

        <!-- Spacer pushes the button down-->
        <div class="flex-1"></div>

        <div>
          <button @click="handleSignOut" class="flex-1 nav-linkg">Sign Out</button>
        </div>
      </nav>
    </div>

    <div class="flex-1 main-content">
      <RouterView />
    </div>
  </div>
</template>

<style>
.nav-container {
  padding-right: 2rem;
  padding-left: 2rem;
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

.margin-vertical:has(.router-link-active) {
  background-color: var(--funkollection-secondary);
  font: bold;
  border-radius: 0.375rem; /* rounded-md */
}

.main-content {
  background-color: var(--funkollection-background);
}

.margin-vertical {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.nav-head {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

.nav-icon {
  font-size: 2rem !important;
}
</style>
