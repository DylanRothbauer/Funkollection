<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { marked } from 'marked'
import { app, auth, db } from '../firebase.js'
import AppPageHeader from '../components/AppPageHeader.vue'
const isAdmin = ref(false)
const isLoadingUserData = ref(true)
const accessError = ref('')
const messagesRemaining = ref(20)
const nextReset = ref('')
const messages = ref([])
const input = ref('')
const loading = ref(false)
const chatError = ref('')
const failedMessage = ref('')
const messagesContainer = ref(null)
const composer = ref(null)

const suggestions = [
  'Summarize the series in my collection',
  'Which Pop in my collection cost the most?',
  'How can I organize my collection better?',
  'Explain the difference between an exclusive and a chase',
]

const canSend = computed(
  () =>
    Boolean(input.value.trim()) && !loading.value && (isAdmin.value || messagesRemaining.value > 0),
)

let resetTimer = null

marked.setOptions({ breaks: true, gfm: true })

function renderSafeMarkdown(text) {
  const rawHtml = marked.parse(String(text || ''))
  const documentNode = new DOMParser().parseFromString(rawHtml, 'text/html')
  const allowedTags = new Set([
    'P',
    'BR',
    'STRONG',
    'EM',
    'UL',
    'OL',
    'LI',
    'CODE',
    'PRE',
    'BLOCKQUOTE',
    'A',
  ])

  documentNode.body.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes)
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (element.tagName !== 'A' || attribute.name !== 'href') {
        element.removeAttribute(attribute.name)
      }
    })

    if (element.tagName === 'A') {
      const href = element.getAttribute('href') || ''
      if (!/^(https?:|mailto:)/i.test(href)) {
        element.removeAttribute('href')
      } else {
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })

  return documentNode.body.innerHTML
}

function computeNextReset() {
  const now = new Date()
  const nextUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  )
  const diffMs = nextUtcMidnight.getTime() - now.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  nextReset.value = `Resets in ${hours}h ${minutes}m at 00:00 UTC`
}

onMounted(async () => {
  computeNextReset()
  resetTimer = setInterval(computeNextReset, 60 * 1000)

  const currentUser = auth.currentUser
  if (!currentUser) {
    accessError.value = 'Please sign in again to use Funko Chat.'
    isLoadingUserData.value = false
    return
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid)
    const docSnap = await getDoc(userDocRef)
    const userData = docSnap.data()

    if (userData?.isAdmin) {
      isAdmin.value = true
      isLoadingUserData.value = false
      return
    }

    const today = new Date().toISOString().split('T')[0]
    if (userData?.chatUsage?.date === today) {
      messagesRemaining.value = Math.max(0, 20 - userData.chatUsage.count)
    }

    isLoadingUserData.value = false
  } catch {
    accessError.value = 'We could not prepare Funko Chat. Please refresh and try again.'
    isLoadingUserData.value = false
  }
})

onBeforeUnmount(() => {
  if (resetTimer) clearInterval(resetTimer)
})

async function sendMessage(text) {
  const message = String(text || input.value).trim()
  if (!message || loading.value || (!isAdmin.value && messagesRemaining.value <= 0)) return

  input.value = ''
  chatError.value = ''
  failedMessage.value = ''
  messages.value.push({ role: 'user', text: message })
  loading.value = true

  await nextTick()
  scrollToBottom()

  try {
    const functions = getFunctions(app, 'us-central1')
    const funkoChat = httpsCallable(functions, 'funkoChat')
    const result = await funkoChat({ message })
    const reply = result.data?.reply
    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('Malformed response')
    }
    messages.value.push({ role: 'assistant', text: reply })
    if (!isAdmin.value && messagesRemaining.value > 0) messagesRemaining.value--
  } catch (error) {
    failedMessage.value = message
    if (error?.code === 'functions/resource-exhausted') {
      messagesRemaining.value = 0
      chatError.value =
        'You have reached today’s 20-message limit. Your allowance resets at 00:00 UTC.'
    } else if (error?.code === 'functions/unauthenticated') {
      chatError.value = 'Your session could not be verified. Please sign in again and retry.'
    } else {
      chatError.value =
        'Funko Assistant could not respond. Your message is still here, and you can retry it.'
    }
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

function retryMessage() {
  const message = failedMessage.value
  if (!message) return
  const failedUserIndex = messages.value.findLastIndex(
    (entry) => entry.role === 'user' && entry.text === message,
  )
  if (failedUserIndex >= 0) messages.value.splice(failedUserIndex, 1)
  sendMessage(message)
}

function clearConversation() {
  messages.value = []
  chatError.value = ''
  failedMessage.value = ''
  input.value = ''
  nextTick(() => composer.value?.focus())
}

function useSuggestion(suggestion) {
  input.value = suggestion
  nextTick(() => composer.value?.focus())
}

function scrollToBottom() {
  if (!messagesContainer.value) return
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <main class="chat-page">
    <section v-if="isLoadingUserData" class="page-status" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <div>
        <h1>Preparing Funko Chat</h1>
        <p>Checking your access and today’s message allowance.</p>
      </div>
    </section>

    <section v-else-if="accessError" class="page-status page-status--error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      <div>
        <h1>Funko Chat unavailable</h1>
        <p>{{ accessError }}</p>
      </div>
    </section>

    <template v-else>
      <AppPageHeader
        eyebrow="Collection assistant"
        title="Funko Chat"
        description="Ask questions about the Pops you track, get collecting guidance, and better understand your collection."
      >
        <template #actions>
          <button
            v-if="messages.length"
            type="button"
            class="clear-button"
            :disabled="loading"
            @click="clearConversation"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
            New conversation
          </button>
        </template>
      </AppPageHeader>

      <section class="chat-shell" aria-label="Funko Assistant conversation">
        <header class="assistant-header">
          <div class="assistant-identity">
            <span class="assistant-mark" aria-hidden="true">
              <i class="pi pi-sparkles"></i>
            </span>
            <div>
              <h2>Funko Assistant</h2>
              <p>Uses the collection saved to your Funkollection account</p>
            </div>
          </div>
          <div
            v-if="!isAdmin"
            class="usage-status"
            :class="{ 'usage-status--low': messagesRemaining <= 5 }"
          >
            <strong>{{ messagesRemaining }}</strong>
            <span>messages left today</span>
          </div>
          <span v-else class="admin-status">Admin access</span>
        </header>

        <div
          ref="messagesContainer"
          class="conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
          <section v-if="messages.length === 0" class="welcome-state">
            <span class="welcome-icon" aria-hidden="true">
              <i class="pi pi-comments"></i>
            </span>
            <p class="welcome-kicker">Start with your collection</p>
            <h2>What would you like to know?</h2>
            <p class="welcome-copy">
              Ask about the Pops recorded in your account or get practical collecting and
              organization advice. Responses are guidance, not live market valuations.
            </p>
            <div class="suggestion-grid" aria-label="Suggested questions">
              <button
                v-for="suggestion in suggestions"
                :key="suggestion"
                type="button"
                class="suggestion"
                @click="useSuggestion(suggestion)"
              >
                <i class="pi pi-arrow-up-right" aria-hidden="true"></i>
                <span>{{ suggestion }}</span>
              </button>
            </div>
          </section>

          <ol v-else class="message-list">
            <li
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', `message--${message.role}`]"
            >
              <div class="speaker">
                <span class="speaker-mark" aria-hidden="true">
                  <i :class="['pi', message.role === 'user' ? 'pi-user' : 'pi-sparkles']"></i>
                </span>
                <strong>{{ message.role === 'user' ? 'You' : 'Funko Assistant' }}</strong>
              </div>
              <div
                v-if="message.role === 'assistant'"
                class="message-content assistant-content"
                v-html="renderSafeMarkdown(message.text)"
              ></div>
              <div v-else class="message-content user-content">{{ message.text }}</div>
            </li>

            <li v-if="loading" class="message message--assistant generating-message">
              <div class="speaker">
                <span class="speaker-mark" aria-hidden="true">
                  <i class="pi pi-sparkles"></i>
                </span>
                <strong>Funko Assistant</strong>
              </div>
              <div class="generating" role="status">
                <span></span><span></span><span></span>
                <span class="generating-label">Thinking about your collection…</span>
              </div>
            </li>
          </ol>
        </div>

        <div v-if="chatError" class="chat-error" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <span>{{ chatError }}</span>
          <button
            v-if="failedMessage && messagesRemaining > 0"
            type="button"
            :disabled="loading"
            @click="retryMessage"
          >
            Retry
          </button>
        </div>

        <footer class="composer-area">
          <div class="composer-meta">
            <span v-if="!isAdmin">{{ nextReset }}</span>
            <span>AI guidance may be incomplete; verify important collecting decisions.</span>
          </div>
          <label for="chat-message" class="sr-only">Message Funko Assistant</label>
          <div class="composer">
            <textarea
              id="chat-message"
              ref="composer"
              v-model="input"
              rows="2"
              maxlength="2000"
              placeholder="Ask about your collection or collecting…"
              :disabled="loading || (!isAdmin && messagesRemaining <= 0)"
              @keydown="handleKeydown"
            ></textarea>
            <button
              type="button"
              class="send-button"
              :disabled="!canSend"
              aria-label="Send message"
              @click="sendMessage()"
            >
              <i class="pi pi-send" aria-hidden="true"></i>
            </button>
          </div>
          <p class="composer-hint">Enter to send · Shift+Enter for a new line</p>
        </footer>
      </section>
    </template>
  </main>
</template>

<style scoped>
.chat-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.chat-page > * {
  width: min(100%, 1100px);
  margin-inline: auto;
}

.clear-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(47, 79, 79, 0.18);
  border-radius: 8px;
  background: white;
  color: var(--funkollection-primary);
  font-weight: 750;
  cursor: pointer;
}

.clear-button:hover:not(:disabled) {
  background: rgba(138, 154, 91, 0.08);
}

.clear-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chat-shell {
  display: grid;
  grid-template-rows: auto minmax(18rem, 1fr) auto auto;
  height: min(47rem, calc(100dvh - 7rem));
  min-height: 36rem;
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid rgba(47, 79, 79, 0.1);
}

.assistant-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.assistant-mark,
.welcome-icon {
  display: grid;
  place-items: center;
  background: var(--funkollection-secondary);
  color: white;
}

.assistant-mark {
  flex: 0 0 2.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
}

.assistant-identity h2,
.assistant-identity p {
  margin: 0;
}

.assistant-identity h2 {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.1rem;
}

.assistant-identity p {
  overflow: hidden;
  color: #74786e;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-status {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  color: #6f736a;
  font-size: 0.68rem;
  text-align: right;
}

.usage-status strong {
  color: var(--funkollection-primary);
  font-size: 1rem;
}

.usage-status--low strong {
  color: #9a4336;
}

.admin-status {
  color: var(--funkollection-primary);
  font-size: 0.75rem;
  font-weight: 800;
}

.conversation {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}

.welcome-state {
  display: grid;
  min-height: 100%;
  padding: clamp(1.5rem, 4vw, 3rem);
  place-items: center;
  align-content: center;
  text-align: center;
}

.welcome-icon {
  width: 3.25rem;
  height: 3.25rem;
  margin-bottom: 0.8rem;
  border-radius: 12px;
  font-size: 1.3rem;
}

.welcome-kicker {
  margin: 0;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.welcome-state h2 {
  margin: 0.25rem 0 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.6rem, 4vw, 2.25rem);
}

.welcome-copy {
  max-width: 38rem;
  margin: 0.55rem 0 1.25rem;
  color: #696d64;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  width: min(100%, 42rem);
}

.suggestion {
  display: flex;
  min-height: 48px;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem;
  border: 1px solid rgba(47, 79, 79, 0.14);
  border-radius: 8px;
  background: #fafaf7;
  color: var(--funkollection-primary);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}

.suggestion:hover {
  border-color: rgba(138, 154, 91, 0.55);
  background: rgba(138, 154, 91, 0.08);
}

.suggestion .pi {
  margin-top: 0.12rem;
  color: var(--funkollection-secondary);
}

.message-list {
  display: grid;
  gap: 1.25rem;
  margin: 0;
  padding: 1.5rem;
  list-style: none;
}

.message {
  display: grid;
  gap: 0.5rem;
  max-width: 46rem;
}

.message--user {
  width: min(82%, 38rem);
  margin-left: auto;
}

.speaker {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #64685f;
  font-size: 0.72rem;
}

.message--user .speaker {
  justify-content: flex-end;
}

.speaker-mark {
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
  place-items: center;
  border-radius: 7px;
  background: rgba(138, 154, 91, 0.14);
  color: var(--funkollection-primary);
  font-size: 0.72rem;
}

.message-content {
  overflow-wrap: anywhere;
  font-size: 0.92rem;
  line-height: 1.65;
}

.assistant-content {
  padding-left: 2.1rem;
  color: #373a36;
}

.user-content {
  padding: 0.75rem 0.9rem;
  border-radius: 12px 12px 3px;
  background: var(--funkollection-primary);
  color: white;
  white-space: pre-wrap;
}

.assistant-content :deep(p) {
  margin: 0 0 0.7rem;
}

.assistant-content :deep(p:last-child) {
  margin-bottom: 0;
}

.assistant-content :deep(ul),
.assistant-content :deep(ol) {
  margin: 0.5rem 0 0.75rem 1.2rem;
  padding: 0;
}

.assistant-content :deep(code) {
  padding: 0.12rem 0.3rem;
  border-radius: 4px;
  background: #eff0eb;
  font-size: 0.85em;
}

.assistant-content :deep(pre) {
  overflow-x: auto;
  padding: 0.75rem;
  border-radius: 8px;
  background: #eff0eb;
}

.assistant-content :deep(a) {
  color: var(--funkollection-primary);
  font-weight: 700;
  text-underline-offset: 3px;
}

.generating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding-left: 2.1rem;
  color: #74786e;
}

.generating > span:not(.generating-label) {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--funkollection-secondary);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.generating > span:nth-child(2) {
  animation-delay: 0.15s;
}

.generating > span:nth-child(3) {
  animation-delay: 0.3s;
}

.generating-label {
  margin-left: 0.35rem;
  font-size: 0.78rem;
}

.chat-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-top: 1px solid #edcbc4;
  background: #fff4f1;
  color: #783a2e;
  font-size: 0.8rem;
}

.chat-error span {
  flex: 1;
}

.chat-error button {
  min-height: 36px;
  padding: 0.35rem 0.65rem;
  border: 1px solid currentColor;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font-weight: 750;
  cursor: pointer;
}

.composer-area {
  padding: 0.8rem 1rem 0.7rem;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
  background: #fafaf7;
}

.composer-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.45rem;
  color: #7a7d75;
  font-size: 0.67rem;
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.55rem;
  padding: 0.55rem;
  border: 1px solid rgba(47, 79, 79, 0.2);
  border-radius: 12px;
  background: white;
}

.composer:focus-within {
  border-color: var(--funkollection-secondary);
  box-shadow: 0 0 0 3px rgba(138, 154, 91, 0.16);
}

.composer textarea {
  max-height: 8rem;
  min-height: 3rem;
  padding: 0.35rem;
  resize: vertical;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--funkollection-text);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
}

.send-button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: var(--funkollection-secondary);
  color: white;
  cursor: pointer;
}

.send-button:hover:not(:disabled) {
  background: var(--funkollection-primary);
}

.send-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.clear-button:focus-visible,
.suggestion:focus-visible,
.chat-error button:focus-visible,
.send-button:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.3);
  outline-offset: 2px;
}

.composer-hint {
  margin: 0.35rem 0 0;
  color: #85887f;
  font-size: 0.68rem;
  text-align: right;
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

.page-status h1,
.page-status p {
  margin: 0;
}

.page-status h1 {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

.page-status p {
  margin-top: 0.2rem;
  color: #696d64;
}

.page-status--error {
  color: #7a3526;
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

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .chat-page {
    padding: 1rem;
  }

  .chat-shell {
    height: calc(100dvh - 6rem);
    min-height: 32rem;
  }

  .assistant-identity p {
    display: none;
  }

  .welcome-state {
    padding: 1.25rem;
  }

  .suggestion-grid {
    grid-template-columns: 1fr;
  }

  .message-list {
    padding: 1rem;
  }

  .message--user {
    width: 90%;
  }

  .assistant-content {
    padding-left: 0;
  }

  .composer-meta {
    flex-direction: column;
    gap: 0.15rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .conversation {
    scroll-behavior: auto;
  }

  .generating > span:not(.generating-label) {
    animation: none;
    opacity: 0.7;
  }
}
</style>
