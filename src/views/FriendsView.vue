<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { db } from '../firebase.js'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppPageHeader from '@/components/AppPageHeader.vue'

const auth = getAuth()
const toast = useToast()
const router = useRouter()

const isLoadingUserData = ref(true)
const friends = ref([])
const friendRequests = ref([])
const isLoadingFriends = ref(true)
const showAddFriendDialog = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const sentRequests = ref([])
const friendSearchQuery = ref('')
const pendingAction = ref('')
const unsubscribers = []

onMounted(async () => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    isLoadingUserData.value = false
    isLoadingFriends.value = false
    return
  }

  isLoadingUserData.value = false

  unsubscribers.push(
    onSnapshot(collection(db, 'users', currentUser.uid, 'friends'), (snapshot) => {
      friends.value = snapshot.docs.map((friendDoc) => ({ id: friendDoc.id, ...friendDoc.data() }))
      isLoadingFriends.value = false
    }),
    onSnapshot(collection(db, 'users', currentUser.uid, 'friendRequests'), (snapshot) => {
      friendRequests.value = snapshot.docs.map((requestDoc) => ({
        id: requestDoc.id,
        ...requestDoc.data(),
      }))
    }),
    onSnapshot(collection(db, 'users', currentUser.uid, 'sentRequests'), (snapshot) => {
      sentRequests.value = snapshot.docs.map((requestDoc) => requestDoc.data().to)
    }),
  )
})

onBeforeUnmount(() => {
  unsubscribers.forEach((unsubscribe) => unsubscribe())
})

async function searchUsers() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  searchResults.value = []

  try {
    const currentUser = auth.currentUser
    const usersSnap = await getDocs(collection(db, 'users'))
    const normalizedQuery = searchQuery.value.toLowerCase().trim()
    searchResults.value = usersSnap.docs
      .map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
      .filter(
        (candidate) =>
          candidate.id !== currentUser.uid &&
          candidate.displayName?.toLowerCase().includes(normalizedQuery),
      )
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Search unavailable',
      detail: 'We could not search for users. Please try again.',
      life: 3000,
    })
  } finally {
    isSearching.value = false
  }
}

function isAlreadyFriend(userId) {
  return friends.value.some((friend) => friend.id === userId)
}

function hasSentRequest(userId) {
  if (isAlreadyFriend(userId)) return false
  return sentRequests.value.includes(userId)
}

async function sendFriendRequest(targetUser) {
  const currentUser = auth.currentUser
  pendingAction.value = `send-${targetUser.id}`
  try {
    await setDoc(doc(db, 'users', targetUser.id, 'friendRequests', currentUser.uid), {
      from: currentUser.uid,
      fromName: currentUser.displayName || currentUser.email,
      fromPhoto: currentUser.photoURL || '',
      sentAt: new Date().toISOString(),
      status: 'pending',
    })
    await setDoc(doc(db, 'users', currentUser.uid, 'sentRequests', targetUser.id), {
      to: targetUser.id,
      sentAt: new Date().toISOString(),
    })
    sentRequests.value.push(targetUser.id)
    toast.add({
      severity: 'success',
      summary: 'Request sent',
      detail: `Friend request sent to ${targetUser.displayName}!`,
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Request failed',
      detail: 'Failed to send friend request.',
      life: 3000,
    })
  } finally {
    pendingAction.value = ''
  }
}

async function acceptRequest(request) {
  pendingAction.value = `accept-${request.from}`
  try {
    const acceptFriendRequest = httpsCallable(getFunctions(), 'acceptFriendRequest')
    await acceptFriendRequest({
      fromUid: request.from,
      fromName: request.fromName,
      fromPhoto: request.fromPhoto,
    })
    toast.add({
      severity: 'success',
      summary: 'Friend added',
      detail: `You and ${request.fromName} are now friends!`,
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Request failed',
      detail: 'Failed to accept request.',
      life: 3000,
    })
  } finally {
    pendingAction.value = ''
  }
}

async function declineRequest(request) {
  pendingAction.value = `decline-${request.from}`
  try {
    const declineFriendRequest = httpsCallable(getFunctions(), 'declineFriendRequest')
    await declineFriendRequest({ fromUid: request.from })
    toast.add({ severity: 'info', summary: 'Request declined', life: 2000 })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Request failed',
      detail: 'Failed to decline request.',
      life: 3000,
    })
  } finally {
    pendingAction.value = ''
  }
}

async function unfriend(friend) {
  pendingAction.value = `remove-${friend.id}`
  try {
    const unfriendUser = httpsCallable(getFunctions(), 'unfriendUser')
    await unfriendUser({ friendUid: friend.id })
    friends.value = friends.value.filter((existingFriend) => existingFriend.id !== friend.id)
    toast.add({
      severity: 'info',
      summary: 'Friend removed',
      detail: `${friend.displayName} removed.`,
      life: 2000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Action failed',
      detail: 'Failed to remove friend.',
      life: 3000,
    })
  } finally {
    pendingAction.value = ''
  }
}

function viewCollection(friend) {
  router.push({
    name: 'friendCollection',
    params: { friendId: friend.id, friendName: friend.displayName },
  })
}

const filteredFriends = computed(() => {
  const normalizedQuery = friendSearchQuery.value.toLowerCase()
  if (!normalizedQuery) return friends.value
  return friends.value.filter((friend) =>
    friend.displayName?.toLowerCase().includes(normalizedQuery),
  )
})
</script>

<template>
  <main class="feature-page">
    <section v-if="isLoadingUserData" class="page-status" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <div>
        <h1>Preparing your friends</h1>
        <p>Checking your membership and social connections.</p>
      </div>
    </section>

    <template v-else>
      <AppPageHeader
        eyebrow="Your collector circle"
        title="Friends"
        description="Connect with collectors you know, respond to requests, and explore each other’s collections."
      >
        <template #actions>
          <Button
            label="Find a friend"
            icon="pi pi-user-plus"
            @click="showAddFriendDialog = true"
          />
        </template>
      </AppPageHeader>

      <section v-if="friendRequests.length" class="social-card requests-card">
        <header class="section-header">
          <div>
            <p class="section-kicker">Needs your attention</p>
            <h2>Incoming requests</h2>
          </div>
          <span class="count-badge">{{ friendRequests.length }}</span>
        </header>

        <div class="request-list">
          <article v-for="request in friendRequests" :key="request.from" class="person-row">
            <div class="person">
              <img
                v-if="request.fromPhoto"
                :src="request.fromPhoto"
                class="avatar"
                :alt="request.fromName"
              />
              <span v-else class="avatar avatar--placeholder" aria-hidden="true">
                {{ request.fromName?.charAt(0) || '?' }}
              </span>
              <div>
                <strong>{{ request.fromName || 'Collector' }}</strong>
                <span>Would like to connect</span>
              </div>
            </div>
            <div class="row-actions">
              <Button
                label="Accept"
                icon="pi pi-check"
                size="small"
                :loading="pendingAction === `accept-${request.from}`"
                @click="acceptRequest(request)"
              />
              <Button
                label="Decline"
                icon="pi pi-times"
                size="small"
                severity="secondary"
                outlined
                :loading="pendingAction === `decline-${request.from}`"
                @click="declineRequest(request)"
              />
            </div>
          </article>
        </div>
      </section>

      <section class="social-card friends-card" aria-labelledby="friends-list-title">
        <header class="section-header friends-header">
          <div>
            <p class="section-kicker">Your connections</p>
            <h2 id="friends-list-title">Current friends</h2>
            <p class="section-summary">
              {{ friends.length }} connected collector{{ friends.length === 1 ? '' : 's' }}
            </p>
          </div>
          <label class="friend-search">
            <span class="sr-only">Search current friends</span>
            <i class="pi pi-search" aria-hidden="true"></i>
            <input v-model="friendSearchQuery" type="search" placeholder="Search friends" />
          </label>
        </header>

        <div v-if="isLoadingFriends" class="friend-skeleton" aria-live="polite">
          <span v-for="index in 3" :key="index"></span>
        </div>

        <AppEmptyState
          v-else-if="friends.length === 0"
          icon="pi-users"
          title="Build your collector circle"
          description="Find another Funkollection member to compare collections and stay connected."
        >
          <Button
            label="Find a friend"
            icon="pi pi-user-plus"
            @click="showAddFriendDialog = true"
          />
        </AppEmptyState>

        <AppEmptyState
          v-else-if="filteredFriends.length === 0"
          icon="pi-search"
          title="No friends match that search"
          description="Try a different display name or clear your search."
        />

        <div v-else class="friend-list">
          <article v-for="friend in filteredFriends" :key="friend.id" class="person-row friend-row">
            <div class="person">
              <img
                v-if="friend.photoURL"
                :src="friend.photoURL"
                class="avatar"
                :alt="friend.displayName"
              />
              <span v-else class="avatar avatar--placeholder" aria-hidden="true">
                {{ friend.displayName?.charAt(0) || '?' }}
              </span>
              <div>
                <strong>{{ friend.displayName || 'Collector' }}</strong>
                <span>
                  {{
                    friend.addedAt
                      ? `Friends since ${new Date(friend.addedAt).toLocaleDateString()}`
                      : 'Funkollection friend'
                  }}
                </span>
              </div>
            </div>
            <div class="row-actions">
              <Button
                label="View collection"
                icon="pi pi-eye"
                size="small"
                outlined
                @click="viewCollection(friend)"
              />
              <Button
                icon="pi pi-user-minus"
                text
                severity="danger"
                size="small"
                :loading="pendingAction === `remove-${friend.id}`"
                :aria-label="`Remove ${friend.displayName || 'friend'}`"
                @click="unfriend(friend)"
              />
            </div>
          </article>
        </div>
      </section>

      <Dialog
        v-model:visible="showAddFriendDialog"
        modal
        header="Find a friend"
        :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
      >
        <div class="friend-dialog">
          <p>Search by the display name another collector uses on Funkollection.</p>
          <form class="dialog-search" @submit.prevent="searchUsers">
            <label for="friend-search-input">Display name</label>
            <div>
              <input
                id="friend-search-input"
                v-model="searchQuery"
                placeholder="Enter a display name"
                autocomplete="off"
              />
              <Button type="submit" label="Search" icon="pi pi-search" :loading="isSearching" />
            </div>
          </form>

          <div v-if="isSearching" class="dialog-status" aria-live="polite">Searching members…</div>
          <AppEmptyState
            v-else-if="searchResults.length === 0 && searchQuery"
            icon="pi-search"
            title="No members found"
            description="Check the display name and try again."
          />
          <div v-else-if="searchResults.length" class="search-results">
            <article v-for="result in searchResults" :key="result.id" class="person-row">
              <div class="person">
                <img
                  v-if="result.photoURL"
                  :src="result.photoURL"
                  class="avatar"
                  :alt="result.displayName"
                />
                <span v-else class="avatar avatar--placeholder" aria-hidden="true">
                  {{ result.displayName?.charAt(0) || '?' }}
                </span>
                <strong>{{ result.displayName }}</strong>
              </div>
              <Button
                v-if="isAlreadyFriend(result.id)"
                label="Friends"
                icon="pi pi-check"
                disabled
              />
              <Button
                v-else-if="hasSentRequest(result.id)"
                label="Request sent"
                icon="pi pi-clock"
                severity="secondary"
                disabled
              />
              <Button
                v-else
                label="Add friend"
                icon="pi pi-user-plus"
                :loading="pendingAction === `send-${result.id}`"
                @click="sendFriendRequest(result)"
              />
            </article>
          </div>
        </div>
      </Dialog>
    </template>
  </main>
</template>

<style scoped>
.feature-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.feature-page > * {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.social-card {
  margin-top: 1rem;
  padding: clamp(1.15rem, 2vw, 1.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.requests-card {
  border-left: 4px solid var(--funkollection-secondary);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-kicker {
  margin: 0 0 0.15rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

h2 {
  font-size: 1.45rem;
}

.section-summary {
  margin: 0.2rem 0 0;
  color: #74786e;
  font-size: 0.85rem;
}

.count-badge {
  min-width: 2rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--funkollection-primary);
  color: white;
  font-weight: 800;
  text-align: center;
}

.request-list,
.friend-list,
.search-results {
  display: grid;
  gap: 0;
}

.person-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.person {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.person > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.person strong,
.person span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person span {
  color: #74786e;
  font-size: 0.8rem;
}

.avatar {
  flex: 0 0 2.75rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.avatar--placeholder {
  display: grid;
  place-items: center;
  background: var(--funkollection-secondary);
  color: white !important;
  font-weight: 800;
}

.row-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
}

.friend-search {
  position: relative;
  display: flex;
  align-items: center;
}

.friend-search .pi {
  position: absolute;
  left: 0.75rem;
  color: #777a72;
}

.friend-search input,
.dialog-search input {
  min-height: 42px;
  border: 1px solid rgba(47, 79, 79, 0.22);
  border-radius: 8px;
  background: white;
  color: var(--funkollection-text);
}

.friend-search input {
  width: min(18rem, 100%);
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
}

.friend-search input:focus-visible,
.dialog-search input:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.3);
  outline-offset: 2px;
}

.friend-dialog > p {
  margin-top: 0;
  color: #656961;
}

.dialog-search label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--funkollection-primary);
  font-size: 0.82rem;
  font-weight: 750;
}

.dialog-search > div {
  display: flex;
  gap: 0.5rem;
}

.dialog-search input {
  min-width: 0;
  flex: 1;
  padding: 0.55rem 0.75rem;
}

.dialog-status {
  padding: 2rem;
  color: #6e7269;
  text-align: center;
}

.friend-skeleton {
  display: grid;
  gap: 0.75rem;
}

.friend-skeleton span {
  height: 4rem;
  border-radius: 8px;
  background: #eceee8;
}

.page-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 55vh;
}

.page-status .pi {
  color: var(--funkollection-secondary);
  font-size: 1.5rem;
}

.page-status p {
  margin: 0.2rem 0 0;
  color: #686b64;
}

.paywall-container {
  display: grid;
  min-height: 70vh;
  place-items: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 768px) {
  .feature-page {
    padding: 1rem;
  }

  .friends-header,
  .person-row {
    align-items: stretch;
    flex-direction: column;
  }

  .friend-search,
  .friend-search input,
  .row-actions {
    width: 100%;
  }

  .row-actions :deep(.p-button) {
    flex: 1 1 auto;
  }

  .dialog-search > div {
    flex-direction: column;
  }
}
</style>
