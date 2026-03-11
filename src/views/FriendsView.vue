<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase.js'
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, where, addDoc
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import PaywallCard from '@/components/PaywallCard.vue'
import { getDoc as getDocFire } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const auth = getAuth()
const toast = useToast()
const router = useRouter()

// Premium check
const isPremium = ref(false)
const isLoadingUserData = ref(true)

// Friends state
const friends = ref([])
const friendRequests = ref([])
const isLoadingFriends = ref(true)

// Add friend dialog
const showAddFriendDialog = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const sentRequests = ref([])

onMounted(async () => {
  const currentUser = auth.currentUser
  if (!currentUser) return

  // Check admin/premium
  const userDocRef = doc(db, 'users', currentUser.uid)
  const userDocSnap = await getDoc(userDocRef)
  if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
    isPremium.value = true
  } else {
    const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
    const subSnap = await getDocs(subscriptionsRef)
    isPremium.value = subSnap.docs.some(d => {
      const data = d.data()
      return data.status === 'active' || data.status === 'trialing'
    })
  }
  isLoadingUserData.value = false

  if (isPremium.value) {
    //await fetchFriends()
    const friendsRef = collection(db, 'users', currentUser.uid, 'friends')
      onSnapshot(friendsRef, (snapshot) => {
        friends.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        isLoadingFriends.value = false
      })

    //await fetchFriendRequests()
    const friendReqRef = collection(db, 'users', currentUser.uid, 'friendRequests')
      onSnapshot(friendReqRef, (snapshot) => {
        friendRequests.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      })

    //await fetchSentRequests()
    const requestsRef = collection(db, 'users', currentUser.uid, 'sentRequests')
      onSnapshot(requestsRef, (snapshot) => {
        sentRequests.value = snapshot.docs.map(d => d.data().to)
})
  }
})

async function fetchFriends() {
  isLoadingFriends.value = true
  const currentUser = auth.currentUser
  const friendsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friends'))
  friends.value = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  isLoadingFriends.value = false
}

async function fetchFriendRequests() {
  const currentUser = auth.currentUser
  const requestsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friendRequests'))
  friendRequests.value = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function fetchSentRequests() {
  const currentUser = auth.currentUser
  // Check all users' friendRequests to see if current user sent them
  // Instead, track locally in a sentRequests subcollection
  const sentSnap = await getDocs(collection(db, 'users', currentUser.uid, 'sentRequests'))
  sentRequests.value = sentSnap.docs.map(d => d.data().to)
}

// Search users by display name
async function searchUsers() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  searchResults.value = []

  const currentUser = auth.currentUser
  const usersSnap = await getDocs(collection(db, 'users'))

  const query = searchQuery.value.toLowerCase().trim()
  searchResults.value = usersSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u =>
      u.id !== currentUser.uid &&
      u.displayName?.toLowerCase().includes(query)
    )

  isSearching.value = false
}

function isAlreadyFriend(userId) {
  return friends.value.some(f => f.id === userId)
}

function hasSentRequest(userId) {
  if (isAlreadyFriend(userId)) return false // already friends, override
  return sentRequests.value.includes(userId)
}

async function sendFriendRequest(targetUser) {
  const currentUser = auth.currentUser
  try {
    // Add to target user's friendRequests
    await setDoc(
      doc(db, 'users', targetUser.id, 'friendRequests', currentUser.uid),
      {
        from: currentUser.uid,
        fromName: currentUser.displayName || currentUser.email,
        fromPhoto: currentUser.photoURL || '',
        sentAt: new Date().toISOString(),
        status: 'pending'
      }
    )

    // Track sent request locally
    await setDoc(
      doc(db, 'users', currentUser.uid, 'sentRequests', targetUser.id),
      { to: targetUser.id, sentAt: new Date().toISOString() }
    )

    sentRequests.value.push(targetUser.id)
    toast.add({ severity: 'success', summary: 'Request Sent', detail: `Friend request sent to ${targetUser.displayName}!`, life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to send friend request.', life: 3000 })
  }
}

async function acceptRequest(request) {
  try {
    const functions = getFunctions()
    const acceptFriendRequest = httpsCallable(functions, 'acceptFriendRequest')
    await acceptFriendRequest({
      fromUid: request.from,
      fromName: request.fromName,
      fromPhoto: request.fromPhoto
    })

    //await fetchFriends()
    //await fetchFriendRequests()
    //await fetchSentRequests()

    toast.add({ severity: 'success', summary: 'Friend Added', detail: `You and ${request.fromName} are now friends!`, life: 3000 })
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to accept request.', life: 3000 })
  }
}

async function declineRequest(request) {
  try {
    const functions = getFunctions()
    const declineFriendRequest = httpsCallable(functions, 'declineFriendRequest')
    await declineFriendRequest({ fromUid: request.from })
    toast.add({ severity: 'info', summary: 'Request Declined', life: 2000 })
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to decline request.', life: 3000 })
  }
}

async function unfriend(friend) {
  try {
    const functions = getFunctions()
    const unfriendUser = httpsCallable(functions, 'unfriendUser')
    await unfriendUser({ friendUid: friend.id })

    friends.value = friends.value.filter(f => f.id !== friend.id)
    toast.add({ severity: 'info', summary: 'Unfriended', detail: `${friend.displayName} removed.`, life: 2000 })
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to unfriend.', life: 3000 })
  }
}

function viewCollection(friend) {
  router.push({ name: 'friendCollection', params: { friendId: friend.id, friendName: friend.displayName } })
}

const friendSearchQuery = ref('')
const filteredFriends = computed(() => {
  const q = friendSearchQuery.value.toLowerCase()
  if (!q) return friends.value
  return friends.value.filter(f => f.displayName?.toLowerCase().includes(q))
})
</script>

<template>
  <div v-if="isLoadingUserData" class="loading-state">
    <p>Loading...</p>
  </div>

  <div v-else-if="!isPremium" class="paywall-container">
    <PaywallCard feature-name="Friends" />
  </div>

  <div v-else class="friends-container">
    <header class="flex items-center justify-between p-4 bg-white shadow-sm rounded-b-lg mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Friends</h1>
      <Button label="Add Friend" icon="pi pi-user-plus" @click="showAddFriendDialog = true" />
    </header>

    <!-- Incoming Friend Requests -->
    <div v-if="friendRequests.length > 0" class="requests-section">
      <h2 class="section-title">Friend Requests <span class="request-badge">{{ friendRequests.length }}</span></h2>
      <div class="requests-list">
        <div v-for="request in friendRequests" :key="request.from" class="request-card">
          <div class="flex items-center gap-3">
            <img v-if="request.fromPhoto" :src="request.fromPhoto" class="friend-avatar" :alt="request.fromName" />
            <div v-else class="friend-avatar-placeholder">{{ request.fromName?.charAt(0) }}</div>
            <span class="font-semibold text-gray-800">{{ request.fromName }}</span>
          </div>
          <div class="flex gap-2">
            <Button label="Accept" icon="pi pi-check" size="small" @click="acceptRequest(request)" />
            <Button label="Decline" icon="pi pi-times" size="small" severity="secondary" @click="declineRequest(request)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Friends List -->
    <div class="friends-section">
      <div class="flex items-center justify-between mb-4">
        <h2 class="section-title">My Friends ({{ friends.length }})</h2>
        <input
          v-model="friendSearchQuery"
          placeholder="Search friends..."
          class="friend-search-input"
        />
      </div>

      <div v-if="isLoadingFriends" class="text-gray-400 text-center py-8">Loading friends...</div>

      <div v-else-if="friends.length === 0" class="empty-state">
        <i class="pi pi-users text-5xl text-gray-300 mb-4"></i>
        <p class="text-gray-400 text-lg">No friends yet. Add some!</p>
      </div>

      <div v-else-if="filteredFriends.length === 0" class="empty-state">
        <p class="text-gray-400 text-lg">No friends match your search.</p>
      </div>

      <div v-else class="friends-table">
        <div class="friends-table-header">
          <span>Name</span>
          <span>Added</span>
          <span>Actions</span>
        </div>
        <div v-for="friend in filteredFriends" :key="friend.id" class="friends-table-row">
          <div class="flex items-center gap-3">
            <img v-if="friend.photoURL" :src="friend.photoURL" class="friend-avatar" :alt="friend.displayName" />
            <div v-else class="friend-avatar-placeholder">{{ friend.displayName?.charAt(0) }}</div>
            <span class="font-medium text-gray-800">{{ friend.displayName }}</span>
          </div>
          <span class="text-gray-400 text-sm">{{ friend.addedAt ? new Date(friend.addedAt).toLocaleDateString() : '' }}</span>
          <div class="flex gap-2">
            <Button label="View Collection" icon="pi pi-eye" size="small" severity="info" @click="viewCollection(friend)" />
            <Button icon="pi pi-user-minus" size="small" severity="danger" outlined @click="unfriend(friend)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Add Friend Dialog -->
    <Dialog v-model:visible="showAddFriendDialog" modal header="Add a Friend" :style="{ width: '480px' }">
      <div class="flex flex-col gap-4 p-2">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            placeholder="Search by display name..."
            class="flex-1 p-2 border rounded"
            @keyup.enter="searchUsers"
          />
          <Button label="Search" icon="pi pi-search" @click="searchUsers" :loading="isSearching" />
        </div>

        <div v-if="isSearching" class="text-center text-gray-400 py-4">Searching...</div>

        <div v-else-if="searchResults.length === 0 && searchQuery" class="text-center text-gray-400 py-4">
          No users found.
        </div>

        <div v-else class="flex flex-col gap-2">
          <div v-for="result in searchResults" :key="result.id" class="search-result-row">
            <div class="flex items-center gap-3">
              <img v-if="result.photoURL" :src="result.photoURL" class="friend-avatar" :alt="result.displayName" />
              <div v-else class="friend-avatar-placeholder">{{ result.displayName?.charAt(0) }}</div>
              <span class="font-medium">{{ result.displayName }}</span>
            </div>
            <Button
              v-if="isAlreadyFriend(result.id)"
              label="Friends"
              icon="pi pi-check"
              size="small"
              disabled
            />
            <Button
              v-else-if="hasSentRequest(result.id)"
              label="Request Sent"
              icon="pi pi-clock"
              size="small"
              severity="secondary"
              disabled
            />
            <Button
              v-else
              label="Add Friend"
              icon="pi pi-user-plus"
              size="small"
              @click="sendFriendRequest(result)"
            />
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.friends-container {
  background: var(--funkollection-background);
  min-height: 100vh;
  padding-bottom: 2rem;
}

.paywall-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--funkollection-background);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #666;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--funkollection-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.request-badge {
  background: #EF4444;
  color: white;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.8rem;
}

.requests-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 0 1.5rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.request-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f9f9f9;
  border-radius: 0.75rem;
}

.friends-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 10px 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.friend-search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  outline: none;
  width: 220px;
}

.friend-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--funkollection-secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.friends-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.friends-table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.friends-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9f9f9;
  border-radius: 0.75rem;
  transition: background 0.15s;
}

.friends-table-row:hover {
  background: #f0f0f0;
}

.search-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 0.75rem;
}

.search-result-row span {
  color: #333333 !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #aaa;
}

@media (max-width: 768px) {
  .requests-section,
  .friends-section {
    margin: 0 0.75rem 1rem;
    padding: 1rem;
  }

  .friends-table-header {
    display: none;
  }

  .friends-table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .friend-search-input {
    width: 140px;
  }
}
</style>
