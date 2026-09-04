<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useLoginStreak } from '../composables/useLoginStreak.js'

const router = useRouter()
const route = useRoute()
const auth = getAuth()
const showMobileNav = ref(false)
const friendRequestCount = ref(0)
const newBadgesCount = ref(0)
const currentUser = ref(null)
const closeButton = ref(null)
const unsubscribers = []
let unsubscribeAuth = null
const { evaluateForUser, evaluateIfDayMayHaveChanged, resetForSignOut } = useLoginStreak()

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && currentUser.value) {
    void evaluateIfDayMayHaveChanged(currentUser.value.uid)
  }
}

const communityLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'pi-th-large' },
  { to: '/funkochat', label: 'Funko Chat', icon: 'pi-sparkles' },
  { to: '/friends', label: 'Friends', icon: 'pi-users', badge: friendRequestCount },
  { to: '/badges', label: 'Badges', icon: 'pi-star', badge: newBadgesCount },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'pi-chart-bar' },
]

const collectionLinks = [
  { to: '/collection', label: 'Collection', icon: 'pi-box' },
  { to: '/favorites', label: 'Favorites', icon: 'pi-heart' },
]

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe())

    if (!user) {
      friendRequestCount.value = 0
      newBadgesCount.value = 0
      resetForSignOut()
      return
    }

    void evaluateForUser(user.uid)

    unsubscribers.push(
      onSnapshot(collection(db, 'users', user.uid, 'friendRequests'), (snapshot) => {
        friendRequestCount.value = snapshot.docs.length
      }),
      onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
        newBadgesCount.value = snapshot.data()?.newBadges?.length || 0
      }),
    )
  })
})

watch(
  () => route.fullPath,
  () => closeMobileNav(),
)

watch(showMobileNav, async (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) {
    await nextTick()
    closeButton.value?.focus()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  unsubscribeAuth?.()
  unsubscribers.forEach((unsubscribe) => unsubscribe())
  document.body.style.overflow = ''
})

async function handleSignOut() {
  closeMobileNav()
  await signOut(auth)
  await router.push('/')
}

function toggleMobileNav() {
  showMobileNav.value = !showMobileNav.value
}

function closeMobileNav() {
  showMobileNav.value = false
}

function userInitial() {
  const identity = currentUser.value?.displayName || currentUser.value?.email
  return identity?.charAt(0)?.toUpperCase() || 'F'
}
</script>

<template>
  <div class="app-shell">
    <header class="mobile-header">
      <RouterLink class="mobile-brand" to="/dashboard" aria-label="Funkollection dashboard">
        <span class="brand-mark" aria-hidden="true">F</span>
        <span>Funkollection</span>
      </RouterLink>
      <button
        type="button"
        class="menu-button"
        :aria-expanded="showMobileNav"
        aria-controls="mobile-navigation"
        aria-label="Open navigation"
        @click="toggleMobileNav"
      >
        <i class="pi pi-bars" aria-hidden="true"></i>
      </button>
    </header>

    <Transition name="drawer">
      <div
        v-if="showMobileNav"
        class="mobile-nav-overlay"
        role="presentation"
        @click.self="closeMobileNav"
        @keydown.esc="closeMobileNav"
      >
        <aside
          id="mobile-navigation"
          class="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Application navigation"
        >
          <div class="drawer-header">
            <RouterLink class="brand" to="/dashboard">
              <span class="brand-mark" aria-hidden="true">F</span>
              <span>
                <strong>Funkollection</strong>
                <small>Your collector space</small>
              </span>
            </RouterLink>
            <button
              ref="closeButton"
              type="button"
              class="icon-button"
              aria-label="Close navigation"
              @click="closeMobileNav"
            >
              <i class="pi pi-times" aria-hidden="true"></i>
            </button>
          </div>

          <nav class="mobile-navigation" aria-label="Mobile">
            <p class="nav-section-label">Explore</p>
            <RouterLink
              v-for="link in communityLinks"
              :key="link.to"
              :to="link.to"
              class="nav-link"
              @click="closeMobileNav"
            >
              <i :class="['pi', link.icon]" aria-hidden="true"></i>
              <span>{{ link.label }}</span>
              <span v-if="link.badge?.value" class="nav-badge">{{ link.badge.value }}</span>
            </RouterLink>

            <p class="nav-section-label nav-section-label--spaced">Collection</p>
            <RouterLink
              v-for="link in collectionLinks"
              :key="link.to"
              :to="link.to"
              class="nav-link"
              @click="closeMobileNav"
            >
              <i :class="['pi', link.icon]" aria-hidden="true"></i>
              <span>{{ link.label }}</span>
            </RouterLink>
          </nav>

          <div class="drawer-account">
            <RouterLink class="account-link" to="/account" @click="closeMobileNav">
              <span class="user-avatar" aria-hidden="true">{{ userInitial() }}</span>
              <span class="account-copy">
                <strong>{{ currentUser?.displayName || 'Your account' }}</strong>
                <small>{{ currentUser?.email || 'Manage profile' }}</small>
              </span>
              <i class="pi pi-chevron-right" aria-hidden="true"></i>
            </RouterLink>
            <button type="button" class="signout-button" @click="handleSignOut">
              <i class="pi pi-sign-out" aria-hidden="true"></i>
              Sign out
            </button>
          </div>
        </aside>
      </div>
    </Transition>

    <aside class="desktop-sidebar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark" aria-hidden="true">F</span>
        <span>
          <strong>Funkollection</strong>
          <small>Your collector space</small>
        </span>
      </RouterLink>

      <nav class="desktop-navigation" aria-label="Primary">
        <p class="nav-section-label">Explore</p>
        <RouterLink v-for="link in communityLinks" :key="link.to" :to="link.to" class="nav-link">
          <i :class="['pi', link.icon]" aria-hidden="true"></i>
          <span>{{ link.label }}</span>
          <span v-if="link.badge?.value" class="nav-badge">{{ link.badge.value }}</span>
        </RouterLink>

        <p class="nav-section-label nav-section-label--spaced">Collection</p>
        <RouterLink v-for="link in collectionLinks" :key="link.to" :to="link.to" class="nav-link">
          <i :class="['pi', link.icon]" aria-hidden="true"></i>
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-account">
        <RouterLink class="account-link" to="/account">
          <span class="user-avatar" aria-hidden="true">{{ userInitial() }}</span>
          <span class="account-copy">
            <strong>{{ currentUser?.displayName || 'Your account' }}</strong>
            <small>{{ currentUser?.email || 'Manage profile' }}</small>
          </span>
          <i class="pi pi-chevron-right" aria-hidden="true"></i>
        </RouterLink>
        <button type="button" class="signout-button" @click="handleSignOut">
          <i class="pi pi-sign-out" aria-hidden="true"></i>
          Sign out
        </button>
      </div>
    </aside>

    <div class="main-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 15.5rem minmax(0, 1fr);
  width: 100vw;
  min-height: 100vh;
  background: var(--funkollection-background);
}

.desktop-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  width: 15.5rem;
  height: 100vh;
  min-height: 0;
  flex-direction: column;
  padding: 1.25rem 1rem;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--funkollection-primary);
  color: white;
}

.brand,
.mobile-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.7rem;
  color: white;
  text-decoration: none;
}

.brand {
  padding: 0.35rem 0.45rem 1.5rem;
}

.brand-mark {
  display: grid;
  flex: 0 0 2.35rem;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 800;
}

.brand > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.brand strong {
  overflow: hidden;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.15rem;
  line-height: 1.2;
  text-overflow: ellipsis;
}

.brand small {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.68rem;
}

.desktop-navigation,
.mobile-navigation {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-section-label {
  margin: 0 0 0.35rem;
  padding-inline: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nav-section-label--spaced {
  margin-top: 1.1rem;
}

.nav-link {
  position: relative;
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  min-height: 44px;
  padding: 0.62rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.nav-link .pi {
  font-size: 1rem;
  text-align: center;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.nav-link.router-link-active {
  border-color: rgba(255, 255, 255, 0.12);
  background: var(--funkollection-secondary);
  color: white;
  font-weight: 800;
}

.nav-link.router-link-active::before {
  position: absolute;
  top: 0.65rem;
  bottom: 0.65rem;
  left: -1rem;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: white;
  content: '';
}

.nav-link:focus-visible,
.brand:focus-visible,
.mobile-brand:focus-visible,
.account-link:focus-visible,
.icon-button:focus-visible,
.menu-button:focus-visible,
.signout-button:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.38);
  outline-offset: 2px;
}

.nav-badge {
  min-width: 1.35rem;
  padding: 0.08rem 0.35rem;
  border-radius: 999px;
  background: white;
  color: var(--funkollection-primary);
  font-size: 0.65rem;
  font-weight: 850;
  text-align: center;
}

.sidebar-account,
.drawer-account {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.account-link {
  display: grid;
  grid-template-columns: 2.2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem;
  border-radius: 8px;
  color: white;
  text-decoration: none;
}

.account-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 50%;
  background: var(--funkollection-secondary);
  color: white;
  font-weight: 850;
}

.account-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.account-copy strong,
.account-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-copy strong {
  font-size: 0.78rem;
}

.account-copy small {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.65rem;
}

.account-link > .pi {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.7rem;
}

.signout-button {
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.45rem;
  padding: 0.55rem 0.7rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #f3b6ae;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 750;
  cursor: pointer;
}

.signout-button:hover {
  background: rgba(160, 56, 43, 0.24);
  color: white;
}

.main-content {
  min-width: 0;
  min-height: 100vh;
  background: var(--funkollection-background);
}

.mobile-header,
.mobile-nav-overlay {
  display: none;
}

@media (max-width: 767px) {
  .app-shell {
    display: block;
  }

  .desktop-sidebar {
    display: none;
  }

  .mobile-header {
    position: fixed;
    z-index: 30;
    top: 0;
    right: 0;
    left: 0;
    display: flex;
    min-height: 56px;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    background: var(--funkollection-primary);
  }

  .mobile-brand {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.05rem;
    font-weight: 800;
  }

  .mobile-brand .brand-mark {
    width: 2rem;
    height: 2rem;
    flex-basis: 2rem;
    font-size: 1.1rem;
  }

  .menu-button,
  .icon-button {
    display: grid;
    width: 42px;
    height: 42px;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: white;
    cursor: pointer;
  }

  .menu-button:hover,
  .icon-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .main-content {
    padding-top: 56px;
  }

  .mobile-nav-overlay {
    position: fixed;
    z-index: 50;
    inset: 0;
    display: block;
    background: rgba(24, 33, 29, 0.54);
  }

  .mobile-drawer {
    display: flex;
    width: min(88vw, 20rem);
    height: 100dvh;
    flex-direction: column;
    padding: 1rem;
    overflow-y: auto;
    background: var(--funkollection-primary);
    color: white;
    box-shadow: 8px 0 28px rgba(17, 29, 24, 0.22);
  }

  .drawer-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .drawer-header .brand {
    padding-bottom: 1.4rem;
  }

  .mobile-navigation {
    flex: 1;
  }

  .drawer-account {
    padding-bottom: max(0.25rem, env(safe-area-inset-bottom));
  }

  .drawer-enter-active,
  .drawer-leave-active {
    transition: opacity 0.18s ease;
  }

  .drawer-enter-active .mobile-drawer,
  .drawer-leave-active .mobile-drawer {
    transition: transform 0.2s ease;
  }

  .drawer-enter-from,
  .drawer-leave-to {
    opacity: 0;
  }

  .drawer-enter-from .mobile-drawer,
  .drawer-leave-to .mobile-drawer {
    transform: translateX(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .drawer-enter-active,
  .drawer-leave-active,
  .drawer-enter-active .mobile-drawer,
  .drawer-leave-active .mobile-drawer {
    transition: none;
  }
}
</style>
