<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import router from '@/router'

const isLoggedIn = ref(false)
const isMenuOpen = ref(false) // 👈 controls hamburger menu

let auth

onMounted(() => {
  auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user
  })
})

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push('/')
  })
}

const handleNavClick = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen w-screen">
    <!-- Mobile Header -->
    <header class="md:hidden flex items-center justify-between bg-primary text-white p-4">
      <h1 class="text-2xl font-bold">Funkollection</h1>
      <button @click="isMenuOpen = !isMenuOpen">
        <i class="pi pi-bars text-3xl"></i>
      </button>
    </header>

    <!-- Sidebar Navigation -->
    <nav
      :class="[
        'bg-primary text-white w-64 p-6 md:block',
        isMenuOpen ? 'block' : 'hidden',
        'md:h-full md:relative absolute z-50 top-0 left-0 h-screen',
      ]"
    >
      <div class="mb-12 hidden md:block">
        <h1 class="text-3xl font-bold">Funkollection</h1>
      </div>

      <div class="space-y-4">
        <RouterLink
          to="/dashboard"
          class="nav-link"
          active-class="router-link-active"
          @click="handleNavClick"
        >
          <i class="pi pi-th-large pr-3"></i> Dashboard
        </RouterLink>

        <RouterLink
          to="/collection"
          class="nav-link"
          active-class="router-link-active"
          @click="handleNavClick"
        >
          <i class="pi pi-box pr-3"></i> Collection
        </RouterLink>

        <RouterLink
          to="/about"
          class="nav-link"
          active-class="router-link-active"
          @click="handleNavClick"
        >
          <i class="pi pi-info pr-3"></i> About
        </RouterLink>

        <RouterLink
          to="/favorites"
          class="nav-link"
          active-class="router-link-active"
          @click="handleNavClick"
        >
          <i class="pi pi-heart pr-3"></i> Favorites
        </RouterLink>
      </div>

      <div class="mt-auto pt-8">
        <button @click="handleSignOut" class="signout-btn">
          <i class="pi pi-sign-out pr-3"></i> Sign Out
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 bg-background overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.bg-primary {
  background-color: var(--funkollection-primary);
}

.bg-background {
  background-color: var(--funkollection-background);
}

.nav-link {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.nav-link:hover {
  background-color: var(--funkollection-secondary);
}

.router-link-active {
  background-color: var(--funkollection-secondary);
  font-weight: bold;
}

.signout-btn {
  color: #e3342f;
  background-color: transparent;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  /* ... other styles ... */
}

.signout-btn:hover {
  background-color: #e3342f;
  color: white;
}
</style>
