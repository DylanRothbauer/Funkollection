<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import ShareCardPreview from '../components/ShareCardPreview.vue'
import { calculateCollectionStats, formatRecordedValue } from '../utils/collectionStats.js'
import {
  applicationAttribution,
  DEFAULT_SHARE_OPTIONS,
  hasShareCardAccess,
  safeCollectorName,
  SHARE_CARD_FORMAT,
} from '../utils/shareCard.js'
import { selectPrimarySubscription } from '../utils/subscriptionPresentation.js'

const isLoading = ref(true)
const loadError = ref('')
const exportError = ref('')
const exportSuccess = ref('')
const isExporting = ref(false)
const isEligible = ref(false)
const stats = ref(null)
const displayName = ref('')
const preview = ref(null)
const options = ref({ ...DEFAULT_SHARE_OPTIONS })

const configuredAppUrl = import.meta.env.VITE_APP_URL
const appOrigin = configuredAppUrl || window.location.origin
const attribution = applicationAttribution(configuredAppUrl, window.location.origin)
const accessibleSummary = computed(() => {
  if (!stats.value) return ''
  const parts = [
    `${stats.value.totalPops} Pops`,
    `${stats.value.favoriteCount} favorites`,
    `${stats.value.seriesCount} series`,
  ]
  if (options.value.showRecordedValue) {
    parts.push(`${formatRecordedValue(stats.value.recordedValue)} in recorded purchase value`)
  } else {
    parts.push(`${stats.value.earnedBadgeCount} badges earned`)
  }
  if (options.value.showTopSeries && stats.value.topSeries) {
    parts.push(`${stats.value.topSeries} as the most collected series`)
  }
  return `The exported card will include ${parts.join(', ')}. ${
    options.value.showDisplayName
      ? `It will show the name ${safeCollectorName(displayName.value)}.`
      : 'It will not include your name.'
  } It never includes your email address or account ID.`
})

onMounted(async () => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    loadError.value = 'You must be signed in to create a collection card.'
    isLoading.value = false
    return
  }

  displayName.value = currentUser.displayName || ''
  try {
    const [userSnapshot, subscriptionSnapshot] = await Promise.all([
      getDoc(doc(db, 'users', currentUser.uid)),
      getDocs(collection(db, 'customers', currentUser.uid, 'subscriptions')),
    ])
    const subscription = selectPrimarySubscription(
      subscriptionSnapshot.docs.map((subscriptionDoc) => subscriptionDoc.data()),
    )
    isEligible.value = hasShareCardAccess({
      subscription,
      isAdmin: Boolean(userSnapshot.data()?.isAdmin),
    })

    if (!isEligible.value) return

    const [funkosSnapshot, favoritesSnapshot, badgesSnapshot] = await Promise.all([
      getDocs(collection(db, 'users', currentUser.uid, 'funkos')),
      getDocs(collection(db, 'users', currentUser.uid, 'favorites')),
      getDocs(collection(db, 'users', currentUser.uid, 'badges')),
    ])
    stats.value = calculateCollectionStats(
      funkosSnapshot.docs.map((funkoDoc) => funkoDoc.data()),
      {
        favoriteCount: favoritesSnapshot.size,
        earnedBadgeCount: badgesSnapshot.size,
      },
    )
  } catch {
    loadError.value = 'We could not prepare your collection card. Please refresh and try again.'
  } finally {
    isLoading.value = false
  }
})

async function downloadCard() {
  if (!isEligible.value || !stats.value?.totalPops || isExporting.value) return
  isExporting.value = true
  exportError.value = ''
  exportSuccess.value = ''
  try {
    await document.fonts?.ready
    await preview.value.exportPng()
    exportSuccess.value = 'Your 1080 × 1080 PNG has been downloaded.'
  } catch {
    exportError.value =
      'The image could not be generated in this browser. Try refreshing or use a current desktop browser.'
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <main class="share-page">
    <header class="share-header">
      <div>
        <RouterLink class="back-link" to="/account">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Back to account
        </RouterLink>
        <p class="eyebrow">Premium collection tool</p>
        <h1>Collection stats card</h1>
        <p>Create a polished snapshot from your real collection data, ready for a social post.</p>
      </div>
      <span class="format-badge">
        <i class="pi pi-image" aria-hidden="true"></i>
        {{ SHARE_CARD_FORMAT.width }} × {{ SHARE_CARD_FORMAT.height }} PNG
      </span>
    </header>

    <section v-if="isLoading" class="page-state" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <div>
        <h2>Preparing your collection card</h2>
        <p>Checking access and gathering your collection statistics.</p>
      </div>
    </section>

    <section v-else-if="loadError" class="page-state page-state--error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      <div>
        <h2>Card unavailable</h2>
        <p>{{ loadError }}</p>
      </div>
    </section>

    <section v-else-if="!isEligible" class="page-state centered-state">
      <span class="state-icon"><i class="pi pi-lock" aria-hidden="true"></i></span>
      <div>
        <span class="premium-label">Premium</span>
        <h2>This tool needs an active Premium plan</h2>
        <p>
          Collection cards are available while a Premium subscription or trial is active. Review
          your plan from Account to upgrade or resolve a billing issue.
        </p>
        <RouterLink class="primary-button" to="/account">Review account</RouterLink>
      </div>
    </section>

    <section v-else-if="!stats?.totalPops" class="page-state centered-state">
      <span class="state-icon"><i class="pi pi-box" aria-hidden="true"></i></span>
      <div>
        <h2>Add your first Pop before sharing</h2>
        <p>Your card uses real collection statistics, so it needs at least one saved item.</p>
        <RouterLink class="primary-button" to="/collection">Go to collection</RouterLink>
      </div>
    </section>

    <div v-else class="generator-layout">
      <section class="preview-panel" aria-labelledby="preview-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Live preview</p>
            <h2 id="preview-heading">Your export</h2>
          </div>
          <span>Square social post</span>
        </div>
        <ShareCardPreview
          ref="preview"
          :stats="stats"
          :display-name="displayName"
          :options="options"
          :attribution="attribution"
        />
        <p class="preview-note">
          The preview scales to fit this page. The downloaded image is always 1080 × 1080.
        </p>
      </section>

      <aside class="controls-panel" aria-labelledby="controls-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Card settings</p>
            <h2 id="controls-heading">Choose what to share</h2>
          </div>
        </div>

        <fieldset>
          <legend>Theme</legend>
          <div class="theme-options">
            <label :class="{ selected: options.theme === 'light' }">
              <input v-model="options.theme" type="radio" value="light" />
              <span class="theme-swatch theme-swatch--light" aria-hidden="true"></span>
              Warm light
            </label>
            <label :class="{ selected: options.theme === 'dark' }">
              <input v-model="options.theme" type="radio" value="dark" />
              <span class="theme-swatch theme-swatch--dark" aria-hidden="true"></span>
              Evergreen
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Privacy &amp; details</legend>
          <label class="toggle-row">
            <span
              ><strong>Display name</strong
              ><small>Off by default. Your email is never included.</small></span
            >
            <input v-model="options.showDisplayName" type="checkbox" />
          </label>
          <label class="toggle-row">
            <span>
              <strong>Recorded purchase value</strong>
              <small>Based only on prices and quantities you entered.</small>
            </span>
            <input v-model="options.showRecordedValue" type="checkbox" />
          </label>
          <label class="toggle-row">
            <span>
              <strong>Most collected series</strong>
              <small>{{
                stats.topSeries ? `Currently ${stats.topSeries}.` : 'No series recorded yet.'
              }}</small>
            </span>
            <input v-model="options.showTopSeries" type="checkbox" :disabled="!stats.topSeries" />
          </label>
        </fieldset>

        <div class="privacy-note">
          <i class="pi pi-shield" aria-hidden="true"></i>
          <p>
            Generated entirely in this browser. No image is uploaded, and the card never includes
            your email, user ID, billing details, or a private collection link.
          </p>
        </div>

        <p class="sr-only" aria-live="polite">{{ accessibleSummary }}</p>
        <p v-if="exportError" class="export-message export-message--error" role="alert">
          {{ exportError }}
        </p>
        <p v-if="exportSuccess" class="export-message export-message--success" role="status">
          {{ exportSuccess }}
        </p>
        <button type="button" class="download-button" :disabled="isExporting" @click="downloadCard">
          <i
            :class="['pi', isExporting ? 'pi-spin pi-spinner' : 'pi-download']"
            aria-hidden="true"
          ></i>
          {{ isExporting ? 'Creating PNG…' : 'Download PNG' }}
        </button>
        <p class="download-help">Filename: <strong>funkollection-collection-stats.png</strong></p>
        <a class="attribution-link" :href="appOrigin" target="_blank" rel="noopener noreferrer">
          Card attribution: {{ attribution }}
        </a>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.share-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.share-page > * {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.share-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1.2rem;
  color: #68716b;
  font-size: 0.75rem;
  font-weight: 800;
  text-decoration: none;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

h1 {
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.08;
}

h2 {
  font-size: 1.3rem;
}

.share-header > div > p:last-child,
.page-state p {
  max-width: 46rem;
  margin: 0.65rem 0 0;
  color: #656a62;
}

.format-badge,
.premium-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  background: rgba(138, 154, 91, 0.14);
  color: var(--funkollection-primary);
  font-size: 0.68rem;
  font-weight: 800;
}

.generator-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(19rem, 0.65fr);
  gap: 1rem;
  align-items: start;
}

.preview-panel,
.controls-panel {
  min-width: 0;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.controls-panel {
  position: sticky;
  top: 1rem;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.panel-heading > span,
.preview-note,
.download-help,
.attribution-link {
  color: #737970;
  font-size: 0.7rem;
}

.preview-note {
  margin: 0.8rem 0 0;
  text-align: center;
}

fieldset {
  min-width: 0;
  margin: 0;
  padding: 1.2rem 0;
  border: 0;
  border-bottom: 1px solid rgba(47, 79, 79, 0.1);
}

legend {
  margin-bottom: 0.75rem;
  color: var(--funkollection-primary);
  font-size: 0.78rem;
  font-weight: 850;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

.theme-options label {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.1rem 0.55rem;
  min-height: 58px;
  padding: 0.65rem;
  border: 1px solid rgba(47, 79, 79, 0.14);
  border-radius: 8px;
  color: #676c65;
  font-size: 0.72rem;
  font-weight: 750;
  cursor: pointer;
}

.theme-options label.selected {
  border-color: var(--funkollection-secondary);
  box-shadow: 0 0 0 2px rgba(138, 154, 91, 0.12);
}

.theme-options input {
  grid-row: span 2;
}

.theme-swatch {
  width: 100%;
  height: 12px;
  border-radius: 999px;
}

.theme-swatch--light {
  background: linear-gradient(90deg, #faf3e0, #8a9a5b);
}

.theme-swatch--dark {
  background: linear-gradient(90deg, #263f3f, #b9c58b);
}

.toggle-row {
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.55rem;
  cursor: pointer;
}

.toggle-row > span {
  display: grid;
  gap: 0.15rem;
}

.toggle-row strong {
  color: var(--funkollection-primary);
  font-size: 0.78rem;
}

.toggle-row small {
  color: #767b73;
  font-size: 0.67rem;
  line-height: 1.45;
}

.toggle-row input {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 1.15rem;
  accent-color: var(--funkollection-secondary);
}

.privacy-note {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(138, 154, 91, 0.09);
  color: #626a59;
}

.privacy-note p {
  margin: 0;
  font-size: 0.69rem;
  line-height: 1.55;
}

.download-button,
.primary-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 8px;
  background: var(--funkollection-secondary);
  color: white;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.download-button {
  width: 100%;
  margin-top: 1rem;
}

.download-button:hover:not(:disabled),
.primary-button:hover {
  background: var(--funkollection-primary);
}

.download-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.download-help,
.attribution-link {
  display: block;
  margin: 0.55rem 0 0;
  overflow-wrap: anywhere;
  text-align: center;
}

.export-message {
  margin: 0.8rem 0 0;
  padding: 0.7rem;
  border-radius: 8px;
  font-size: 0.72rem;
}

.export-message--error {
  background: #fff2ef;
  color: #7a3526;
}

.export-message--success {
  background: #edf5e8;
  color: #476b3c;
}

.page-state {
  display: flex;
  min-height: 22rem;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
}

.page-state > .pi {
  color: var(--funkollection-secondary);
  font-size: 1.5rem;
}

.page-state--error {
  color: #7a3526;
}

.centered-state {
  text-align: center;
}

.centered-state > div {
  display: flex;
  max-width: 36rem;
  flex-direction: column;
  align-items: center;
}

.state-icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 3.5rem;
  place-items: center;
  border-radius: 12px;
  background: rgba(138, 154, 91, 0.14);
  color: var(--funkollection-primary);
  font-size: 1.25rem;
}

.centered-state .primary-button {
  margin-top: 1rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.36);
  outline-offset: 3px;
}

@media (max-width: 1024px) {
  .generator-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    max-width: 48rem;
  }

  .controls-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .share-page {
    padding: 1rem;
  }

  .share-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }

  .page-state {
    align-items: center;
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 420px) {
  .share-page {
    padding-inline: 0.75rem;
  }

  .share-header,
  .preview-panel,
  .controls-panel {
    padding: 1.15rem;
  }

  .theme-options {
    grid-template-columns: 1fr;
  }
}
</style>
