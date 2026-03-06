<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { getAuth } from 'firebase/auth'
import {getFunctions, httpsCallable} from 'firebase/functions'
import { marked } from 'marked'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase.js'
import PaywallCard from '../components/PaywallCard.vue'

const isPremium = ref(false)
const isLoadingUserData = ref(true)

const messages = ref([
  {
    role: 'assistant',
    text: "Hey there! I'm Funko Assistant 🎯 Ask me anything about your collection — like how many Pops you own, your most expensive one, or what series you collect!",
  },
])

function renderMarkdown(text) {
  return marked.parse(text)
}

const input = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

const suggestions = [
  'How many Pops do I have?',
  "What's my most expensive Pop?",
  'Which series do I collect?',
  'Do I have any Marvel Pops?',
]

async function sendMessage(text) {
  const message = text || input.value.trim()
  if (!message || loading.value) return

  input.value = ''
  messages.value.push({ role: 'user', text: message })
  loading.value = true

  await nextTick()
  scrollToBottom()

  try {
    const functions = getFunctions()
    const funkoChat = httpsCallable(functions, 'funkoChat')
    const result = await funkoChat({ message })
    messages.value.push({ role: 'assistant', text: result.data.reply })
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      text: 'Sorry, I ran into an error. Please try again!',
    })
    console.error('Chat error:', error)
  } finally {
    loading.value = false
    nextTick(() => scrollToBottom())
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  const currentUser = auth.currentUser
  if (!currentUser) return

  const userDocRef = doc(db, 'users', currentUser.uid)
  getDoc(userDocRef).then((docSnap) => {
    if (docSnap.exists() && docSnap.data().isAdmin) {
      isPremium.value = true
      isLoadingUserData.value = false
      return
    }

    const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
    onSnapshot(subscriptionsRef, (snapshot) => {
      isPremium.value = snapshot.docs.some(doc => {
        const data = doc.data()
        return data.status === 'active' || data.status === 'trialing'
      })
      isLoadingUserData.value = false
    })
  })
})

</script>

<template>
  <div v-if="isLoadingUserData" class="loading-state">
    <p>Loading...</p>
  </div>

  <div v-else-if="isPremium">
    <div class="chat-page">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-avatar">
            <i class="pi pi-sparkles"></i>
          </div>
          <div>
            <h1 class="chat-title">Funko Assistant</h1>
            <span class="chat-subtitle">Ask anything about your collection</span>
          </div>
        </div>
        <div class="chat-status">
          <span class="status-dot"></span>
          Online
        </div>
      </div>

      <!-- Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['message-row', msg.role === 'user' ? 'message-row--user' : 'message-row--assistant']"
        >
          <div v-if="msg.role === 'assistant'" class="message-avatar">
            <i class="pi pi-sparkles"></i>
          </div>
          <div :class="['message-bubble', msg.role === 'user' ? 'bubble--user' : 'bubble--assistant']">
            <span v-if="msg.role === 'assistant'" v-html="renderMarkdown(msg.text)"></span>
            <span v-else>{{ msg.text }}</span>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="loading" class="message-row message-row--assistant">
          <div class="message-avatar">
            <i class="pi pi-sparkles"></i>
          </div>
          <div class="message-bubble bubble--assistant bubble--loading">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-if="messages.length <= 1" class="chat-suggestions">
        <button
          v-for="s in suggestions"
          :key="s"
          class="suggestion-chip"
          @click="sendMessage(s)"
        >
          {{ s }}
        </button>
      </div>

      <!-- Input -->
      <div class="chat-input-area">
        <div class="chat-input-wrapper">
          <textarea
            v-model="input"
            placeholder="Ask about your collection..."
            class="chat-input"
            rows="1"
            @keydown="handleKeydown"
          />
          <button
            class="send-btn"
            :disabled="!input.trim() || loading"
            @click="sendMessage()"
          >
            <i class="pi pi-send"></i>
          </button>
        </div>
        <p class="chat-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>

    </div>
  </div>

  <div v-else class="paywall-container">
    <PaywallCard feature-name="Funko Chat" />
  </div>
  
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  gap: 1rem;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--funkollection-secondary, #2d5a3d);
  border-radius: 16px;
  color: white;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-avatar {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  background: var(--funkollection-gradient, linear-gradient(135deg, #c084fc, #f472b6, #fbbf24));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

.chat-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.chat-subtitle {
  font-size: 0.8rem;
  opacity: 0.75;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  opacity: 0.85;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
  scrollbar-width: thin;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
}

.message-row--user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--funkollection-gradient, linear-gradient(135deg, #c084fc, #f472b6, #fbbf24));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: white;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.bubble--assistant {
  background: var(--funkollection-background, #f5f0e8);
  color: var(--funkollection-text, #1a1a1a);
  border-bottom-left-radius: 4px;
}

.bubble--user {
  background: var(--funkollection-secondary, #2d5a3d);
  color: white;
  border-bottom-right-radius: 4px;
}

/* Loading dots */
.bubble--loading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.85rem 1.1rem;
}

.bubble--loading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #888;
  animation: bounce 1.2s infinite;
}

.bubble--loading span:nth-child(2) { animation-delay: 0.2s; }
.bubble--loading span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

/* Suggestions */
.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.suggestion-chip {
  padding: 0.45rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--funkollection-secondary, #2d5a3d);
  background: transparent;
  color: var(--funkollection-secondary, #2d5a3d);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.suggestion-chip:hover {
  background: var(--funkollection-secondary, #2d5a3d);
  color: white;
}

/* Input */
.chat-input-area {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background: var(--funkollection-background, #f5f0e8);
  border-radius: 16px;
  padding: 0.6rem 0.6rem 0.6rem 1rem;
  border: 1px solid #ddd;
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 0.95rem;
  color: var(--funkollection-text, #1a1a1a);
  font-family: inherit;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

.chat-input::placeholder {
  color: #aaa;
}

.send-btn {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: none;
  background: var(--funkollection-gradient, linear-gradient(135deg, #c084fc, #f472b6, #fbbf24));
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: opacity 0.2s, transform 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.85;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-hint {
  font-size: 0.75rem;
  color: #aaa;
  text-align: center;
  margin: 0;
}

/* Mobile */
@media (max-width: 768px) {
  .chat-page {
    height: calc(100vh - 2rem);
    padding: 0.75rem;
  }

  .message-bubble {
    max-width: 85%;
  }

  .suggestion-chip {
    font-size: 0.8rem;
  }
}

.bubble--assistant :deep(p) {
  margin: 0 0 0.5rem;
}
.bubble--assistant :deep(p:last-child) {
  margin: 0;
}
.bubble--assistant :deep(strong) {
  font-weight: 700;
  color: #1a1a1a;
}
.bubble--assistant :deep(ol), 
.bubble--assistant :deep(ul) {
  margin: 0.5rem 0 0.5rem 1.2rem;
  padding: 0;
}
.bubble--assistant :deep(li) {
  margin-bottom: 0.25rem;
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
  font-size: 1.125rem;
}

</style>