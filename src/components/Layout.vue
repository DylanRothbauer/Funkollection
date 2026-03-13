<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import router from '@/router'
import { collection, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/firebase.js'

const isLoggedIn = ref(false)
const showMobileNav = ref(false)
const friendRequestCount = ref(0)
const newBadgesCount = ref(0)
let auth

onMounted(() => {
  auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true
      // Listen for friend requests in real time
      const requestsRef = collection(db, 'users', user.uid, 'friendRequests')
      onSnapshot(requestsRef, (snapshot) => {
        friendRequestCount.value = snapshot.docs.length
      })
      onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const data = snap.data()
      newBadgesCount.value = data?.newBadges?.length || 0
    })
    } else {
      isLoggedIn.value = false
      friendRequestCount.value = 0
    }
  })
})

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push('/')
  })
}
const toggleMobileNav = () => {
  showMobileNav.value = !showMobileNav.value
}
const closeMobileNav = () => {
  showMobileNav.value = false
}
</script>

<template>
  <div class="flex flex-col min-h-screen w-screen">
    <!-- Mobile Header -->
    <div class="mobile-header md:hidden flex items-center justify-between px-3 py-2 bg-[var(--funkollection-primary)] fixed top-0 left-0 right-0 z-30">
      <h1 class="sora font-bold text-xl text-white leading-tight m-0">Funkollection</h1>
      <button @click="toggleMobileNav" aria-label="Open navigation" class="hamburger-btn" style="padding: 0.4rem">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Mobile Nav Drawer -->
    <transition name="fade">
      <div v-if="showMobileNav" class="mobile-nav-overlay md:hidden" @click.self="closeMobileNav">
        <nav class="mobile-nav flex flex-col bg-[var(--funkollection-primary)] text-white px-3 pt-3 pb-2 w-4/5 max-w-xs h-full fixed top-0 left-0 z-50 shadow-lg">
          <button @click="closeMobileNav" aria-label="Close navigation" class="self-end mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div class="flex flex-col flex-1 gap-2">
            <div class="nav-section-label-mobile">✦ Premium</div>
            <RouterLink to="/dashboard" class="nav-link text-xl py-2" @click="closeMobileNav" active-class="router-link-active">Dashboard</RouterLink>
            <RouterLink to="/funkochat" class="nav-link text-xl py-2 whitespace-nowrap" @click="closeMobileNav" active-class="router-link-active">Funko Chat</RouterLink>
            <RouterLink to="/friends" class="nav-link text-xl py-2 flex items-center gap-2" @click="closeMobileNav" active-class="router-link-active">
              Friends
              <span v-if="friendRequestCount > 0" class="nav-badge">{{ friendRequestCount }}</span>
            </RouterLink>
            <RouterLink to="/badges" class="nav-link text-xl py-2 flex items-center gap-2" @click="closeMobileNav" active-class="router-link-active">
              Badges
              <span v-if="newBadgesCount > 0" class="nav-badge">{{ newBadgesCount }}</span>
            </RouterLink>
            <div class="mobile-nav-divider"></div>
            <RouterLink to="/collection" class="nav-link text-xl py-2" @click="closeMobileNav" active-class="router-link-active">Collection</RouterLink>
            <RouterLink to="/favorites" class="nav-link text-xl py-2" @click="closeMobileNav" active-class="router-link-active">Favorites</RouterLink>
            <RouterLink to="/account" class="nav-link text-xl py-2" @click="closeMobileNav" active-class="router-link-active">Account</RouterLink>
          </div>
          <div class="flex-1"></div>
          <button @click="handleSignOut" class="nav-link text-xl mb-2 signout-btn mobile-signout">
            Sign Out
          </button>
        </nav>
      </div>
    </transition>

    <!-- Desktop Layout -->
    <div class="flex flex-1 w-full min-h-screen">
      <div class="hidden md:flex nav-container min-h-screen" style="align-self: stretch;">
        <nav class="flex flex-col w-48 h-full">
          <div>
            <h1 class="sora nav-head font-bold text-3xl flex-1 items-center">Funkollection</h1>
          </div>
            <div class="nav-section-label">✦ Premium</div>
            <div class="nav-premium-group">

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
                <RouterLink to="/funkochat" class="flex nav-link text-xl items-center" active-class="router-link-active">
                  <i class="pi pi-sparkles pr-3 w-3 nav-icon"></i>
                  <span class="ml-2 flex-1">Funko Chat</span>
                </RouterLink>
              </div>

              <div class="margin-vertical">
                <RouterLink to="/friends" class="flex nav-link text-xl items-center" active-class="router-link-active">
                  <i class="pi pi-users pr-3 w-3 nav-icon"></i>
                  <span class="ml-2 flex-1">Friends</span>
                  <span v-if="friendRequestCount > 0" class="nav-badge">{{ friendRequestCount }}</span>
                </RouterLink>
              </div>

              <div class="margin-vertical">
                <RouterLink to="/badges" class="flex nav-link text-xl items-center" active-class="router-link-active">
                  <i class="pi pi-star pr-3 w-3 nav-icon"></i>
                  <span class="ml-2 flex-1">Badges</span>
                  <span v-if="newBadgesCount > 0" class="nav-badge">{{ newBadgesCount }}</span>
                </RouterLink>
              </div>
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
              to="/favorites"
              class="flex nav-link text-xl items-center"
              active-class="router-link-active"
            >
              <i class="pi pi-heart pr-3 w-3 nav-icon"></i>
              <span class="ml-2 flex-1">Favorites</span>
            </RouterLink>
          </div>
          <div>
            <RouterLink
              to="/account"
              class="flex nav-link text-xl items-center justify-center mb-4"
              active-class="router-link-active"
            >
              <i class="pi pi-user pr-3 w-3 nav-icon"></i>
              <span class="ml-2 flex-1">Account</span>
            </RouterLink>
          </div>

          <!-- Add more links as needed here -->
          <!-- Spacer pushes the button down-->
          <div class="flex-1"></div>

          <div>
            <button
              @click="handleSignOut"
              class="flex nav-link text-xl items-center justify-center signout-btn"
            >
              <i class="pi pi-sign-out pr-3 w-3 nav-icon"></i>
              <span class="ml-2 flex-1">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>

      <div class="flex-1 min-w-0 main-content min-h-screen">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style>
/* Desktop nav */
.nav-container {
  padding-right: 2rem;
  padding-left: 2rem;
  text-align: center;
  color: var(--funkollection-soft-white);
  background-color: var(--funkollection-primary);
  min-height: 100vh;
  align-self: stretch;  /* stretches to match sibling content height */
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.nav-link {
  margin: 1rem;
}

.nav-link:hover {
  cursor: pointer;
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

.signout-btn {
  width: 100%;
  color: #e3342f;
  background: transparent;
  border-radius: 0.375rem;
  font-weight: bold;
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  transition:
    color 0.2s,
    background 0.2s;
  border: none;
}
.signout-btn:hover {
  color: #fff;
  background: #e3342f;
}

/* Mobile nav */
.mobile-header {
  min-height: 48px;
  padding-top: 0.25rem !important;
  padding-bottom: 0.25rem !important;
}
.hamburger-btn {
  background: none;
  border: none;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
}
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
}
.mobile-nav {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}
.mobile-signout {
  margin-top: auto !important;
  margin-bottom: 1.5rem !important;
  width: 100%;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-container {
    display: none !important;
  }
  .main-content {
    min-height: 100vh;
    padding-bottom: 2rem;
  }
}

.nav-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.5rem 1rem 0.25rem;
  background: linear-gradient(135deg, #c084fc, #f472b6, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-top: 0.5rem;
}

.nav-premium-group {
  border-left: 2px solid;
  border-image: linear-gradient(to bottom, #c084fc, #fbbf24) 1;
  padding-left: 0.25rem;
}

.nav-section-label-mobile {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.75rem 1rem 0.25rem;
  background: linear-gradient(135deg, #c084fc, #f472b6, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-top: 0.5rem;
}

.nav-premium-group .margin-vertical:has(.router-link-active) {
  background-color: var(--funkollection-secondary);
  border-radius: 0.375rem;
}

.margin-vertical:has(.router-link-active) {
  background-color: var(--funkollection-secondary);
  font: bold;
  border-radius: 0.375rem; /* rounded-md */
}

.mobile-nav-divider {
  height: 1px;
  background: rgba(255,255,255,0.15);
  margin: 0.5rem 1rem;
}

.mobile-nav .nav-link {
  color: white !important;
}

.mobile-nav .signout-btn {
  color: #e3342f !important;
}

@media (max-width: 768px) {
  .main-content {
    min-height: 100vh;
    padding-bottom: 2rem;
    padding-top: 48px; /* height of fixed header */
  }
}

.nav-badge {
  background: #EF4444;
  color: white;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

</style>
