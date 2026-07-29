<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useAuthUser } from '../composables/useAuthUser.js'
import { getCheckoutUrl, getPortalUrl } from '../../stripePayment.js'
import { app, auth, db } from '../firebase.js'
import {
  presentSubscription,
  selectPrimarySubscription,
} from '../utils/subscriptionPresentation.js'
import { hasShareCardAccess } from '../utils/shareCard.js'

const PREMIUM_PRICE_ID = 'price_1T86oGLancjOeFyBC9PctmbE'

const router = useRouter()
const { user, loading: authLoading } = useAuthUser()
const isLoadingAccount = ref(true)
const billingError = ref('')
const actionError = ref('')
const isAdmin = ref(false)
const isStartingCheckout = ref(false)
const isOpeningPortal = ref(false)
const isSigningOut = ref(false)
const subscriptions = ref([])
let unsubscribeSubscriptions = null

const primarySubscription = computed(() => selectPrimarySubscription(subscriptions.value))
const subscriptionView = computed(() => presentSubscription(primarySubscription.value))
const displayName = computed(() => user.value?.displayName || 'Funkollection collector')
const emailAddress = computed(() => user.value?.email || 'Email unavailable')
const profileInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const providerName = computed(() => {
  const providerId = user.value?.providerData?.[0]?.providerId
  return providerId === 'google.com' ? 'Google' : providerId ? 'Connected account' : 'Not available'
})
const accountCreated = computed(() => {
  const creationTime = user.value?.metadata?.creationTime
  if (!creationTime) return 'Not available'
  const date = new Date(creationTime)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
})
const headerStatus = computed(() => {
  if (isAdmin.value) return 'Administrator'
  return subscriptionView.value.plan === 'Free'
    ? 'Free plan'
    : `${subscriptionView.value.plan} plan`
})
const canUseShareCard = computed(() =>
  hasShareCardAccess({
    subscriptionStatus: primarySubscription.value?.status,
    isAdmin: isAdmin.value,
  }),
)

async function loadAccount(currentUser) {
  unsubscribeSubscriptions?.()
  unsubscribeSubscriptions = null
  subscriptions.value = []
  isAdmin.value = false
  billingError.value = ''
  actionError.value = ''

  if (!currentUser) {
    isLoadingAccount.value = false
    return
  }

  isLoadingAccount.value = true

  try {
    const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid))
    isAdmin.value = Boolean(userSnapshot.data()?.isAdmin)
  } catch {
    actionError.value =
      'Some account details could not be loaded. Your billing information is still available below.'
  }

  unsubscribeSubscriptions = onSnapshot(
    collection(db, 'customers', currentUser.uid, 'subscriptions'),
    (snapshot) => {
      subscriptions.value = snapshot.docs.map((subscriptionDoc) => subscriptionDoc.data())
      isLoadingAccount.value = false
    },
    () => {
      billingError.value =
        'Billing details are temporarily unavailable. Please refresh and try again.'
      isLoadingAccount.value = false
    },
  )
}

async function upgradeToPremium() {
  if (isStartingCheckout.value) return
  isStartingCheckout.value = true
  actionError.value = ''

  try {
    const checkoutUrl = await getCheckoutUrl(app, PREMIUM_PRICE_ID)
    window.location.assign(checkoutUrl)
  } catch {
    actionError.value = 'We could not start checkout. Please try again in a moment.'
    isStartingCheckout.value = false
  }
}

async function manageSubscription() {
  if (isOpeningPortal.value) return
  isOpeningPortal.value = true
  actionError.value = ''

  try {
    const portalUrl = await getPortalUrl(app)
    window.location.assign(portalUrl)
  } catch {
    actionError.value = 'We could not open billing management. Please try again in a moment.'
    isOpeningPortal.value = false
  }
}

async function handleSignOut() {
  if (isSigningOut.value) return
  isSigningOut.value = true
  actionError.value = ''

  try {
    await signOut(auth)
    await router.push('/')
  } catch {
    actionError.value = 'We could not sign you out. Please try again.'
    isSigningOut.value = false
  }
}

watch(user, loadAccount, { immediate: true })

onBeforeUnmount(() => {
  unsubscribeSubscriptions?.()
})
</script>

<template>
  <main class="account-page">
    <section v-if="authLoading || isLoadingAccount" class="account-loading" aria-live="polite">
      <span class="loading-spinner" aria-hidden="true"></span>
      <div>
        <h1>Loading your account</h1>
        <p>Checking your profile and subscription details.</p>
      </div>
    </section>

    <template v-else>
      <header class="account-hero">
        <div>
          <p class="eyebrow">Account settings</p>
          <h1>Your account</h1>
          <p class="hero-intro">
            Review your profile, subscription, and account tools in one place.
          </p>
        </div>
        <div class="identity-summary">
          <img v-if="user?.photoURL" :src="user.photoURL" :alt="`${displayName}'s profile`" />
          <span v-else class="avatar-fallback" aria-hidden="true">{{ profileInitial }}</span>
          <span>
            <strong>{{ displayName }}</strong>
            <small>{{ headerStatus }}</small>
          </span>
        </div>
      </header>

      <div v-if="actionError" class="account-alert" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        <span>{{ actionError }}</span>
      </div>

      <div class="account-layout">
        <div class="account-main">
          <section class="account-section" aria-labelledby="profile-heading">
            <div class="section-heading">
              <span class="section-icon"><i class="pi pi-user" aria-hidden="true"></i></span>
              <div>
                <h2 id="profile-heading">Profile</h2>
                <p>Your identity and sign-in information.</p>
              </div>
            </div>

            <div class="profile-summary">
              <img v-if="user?.photoURL" :src="user.photoURL" :alt="`${displayName}'s profile`" />
              <span v-else class="profile-fallback" aria-hidden="true">{{ profileInitial }}</span>
              <div>
                <strong>{{ displayName }}</strong>
                <span>{{ emailAddress }}</span>
              </div>
            </div>

            <dl class="detail-list">
              <div>
                <dt>Email address</dt>
                <dd>{{ emailAddress }}</dd>
              </div>
              <div>
                <dt>Sign-in method</dt>
                <dd>{{ providerName }}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{{ accountCreated }}</dd>
              </div>
              <div>
                <dt>Account role</dt>
                <dd>{{ isAdmin ? 'Administrator' : 'Collector' }}</dd>
              </div>
            </dl>
          </section>

          <section class="account-section billing-section" aria-labelledby="billing-heading">
            <div class="section-heading">
              <span class="section-icon"><i class="pi pi-wallet" aria-hidden="true"></i></span>
              <div>
                <h2 id="billing-heading">Subscription &amp; billing</h2>
                <p>Your personal plan and billing-management options.</p>
              </div>
            </div>

            <div v-if="billingError" class="inline-state inline-state--error" role="alert">
              <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
              <div>
                <strong>Billing information unavailable</strong>
                <span>{{ billingError }}</span>
              </div>
            </div>

            <template v-else>
              <div class="plan-summary">
                <div>
                  <span class="plan-label">Current plan</span>
                  <h3>{{ subscriptionView.plan }}</h3>
                  <span class="status-badge" :class="`status-badge--${subscriptionView.tone}`">
                    <i class="pi pi-circle-fill" aria-hidden="true"></i>
                    {{ subscriptionView.label }}
                  </span>
                </div>
                <p>{{ subscriptionView.message }}</p>
              </div>

              <dl v-if="subscriptionView.details.length" class="billing-details">
                <div v-for="detail in subscriptionView.details" :key="detail.label">
                  <dt>{{ detail.label }}</dt>
                  <dd>{{ detail.value }}</dd>
                </div>
              </dl>

              <p v-if="isAdmin && !primarySubscription" class="admin-access-note">
                <i class="pi pi-shield" aria-hidden="true"></i>
                Your administrator access includes premium features, but it is separate from a paid
                subscription.
              </p>

              <div class="billing-actions">
                <button
                  v-if="subscriptionView.canManage"
                  type="button"
                  class="primary-button"
                  :disabled="isOpeningPortal"
                  @click="manageSubscription"
                >
                  <i
                    :class="['pi', isOpeningPortal ? 'pi-spin pi-spinner' : 'pi-external-link']"
                    aria-hidden="true"
                  ></i>
                  {{ isOpeningPortal ? 'Opening billing…' : 'Manage subscription' }}
                </button>
                <button
                  v-if="subscriptionView.canUpgrade"
                  type="button"
                  class="primary-button"
                  :disabled="isStartingCheckout"
                  @click="upgradeToPremium"
                >
                  <i
                    :class="['pi', isStartingCheckout ? 'pi-spin pi-spinner' : 'pi-arrow-up-right']"
                    aria-hidden="true"
                  ></i>
                  {{ isStartingCheckout ? 'Preparing checkout…' : 'Upgrade to Premium' }}
                </button>
                <p v-if="subscriptionView.canManage">
                  Stripe’s secure billing portal handles payment methods, invoices, and
                  cancellation.
                </p>
              </div>
            </template>
          </section>

          <section class="account-section" aria-labelledby="sharing-heading">
            <div class="section-heading">
              <span class="section-icon"><i class="pi pi-share-alt" aria-hidden="true"></i></span>
              <div>
                <h2 id="sharing-heading">Sharing &amp; collection tools</h2>
                <p>Tools that make your collection easier to use beyond the app.</p>
              </div>
            </div>

            <div class="setting-row share-tool-row">
              <div>
                <div class="setting-title">
                  <strong>Collection stats card</strong>
                  <span class="premium-feature-label">Premium</span>
                </div>
                <p>
                  Turn your real collection totals into a polished 1080 × 1080 image for social
                  sharing.
                </p>
              </div>
              <RouterLink v-if="canUseShareCard" class="secondary-button" to="/account/share-card">
                Create card
                <i class="pi pi-arrow-right" aria-hidden="true"></i>
              </RouterLink>
              <button
                v-else-if="!billingError && subscriptionView.canUpgrade"
                type="button"
                class="secondary-button"
                :disabled="isStartingCheckout"
                @click="upgradeToPremium"
              >
                <i
                  :class="['pi', isStartingCheckout ? 'pi-spin pi-spinner' : 'pi-lock']"
                  aria-hidden="true"
                ></i>
                {{ isStartingCheckout ? 'Preparing…' : 'Unlock with Premium' }}
              </button>
              <span v-else class="access-unavailable">
                <i class="pi pi-lock" aria-hidden="true"></i>
                Access unavailable
              </span>
            </div>
          </section>
        </div>

        <aside class="account-side" aria-label="Account actions and access">
          <section
            v-if="isAdmin"
            class="account-section admin-section"
            aria-labelledby="admin-heading"
          >
            <div class="section-heading">
              <span class="section-icon"><i class="pi pi-shield" aria-hidden="true"></i></span>
              <div>
                <h2 id="admin-heading">Administrator access</h2>
                <p>Your application-level access.</p>
              </div>
            </div>
            <div class="admin-callout">
              <strong>Full feature access</strong>
              <p>
                Your administrator role bypasses premium feature checks. Personal billing remains
                separate above.
              </p>
            </div>
          </section>

          <section class="account-section" aria-labelledby="security-heading">
            <div class="section-heading">
              <span class="section-icon"><i class="pi pi-lock" aria-hidden="true"></i></span>
              <div>
                <h2 id="security-heading">Security &amp; account</h2>
                <p>Manage your active session.</p>
              </div>
            </div>

            <div class="security-note">
              <i class="pi pi-google" aria-hidden="true"></i>
              <div>
                <strong>Protected by Google sign-in</strong>
                <p>
                  Your authentication credentials are managed by Google. Funkollection does not
                  store a separate password.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="signout-action"
              :disabled="isSigningOut"
              @click="handleSignOut"
            >
              <i
                :class="['pi', isSigningOut ? 'pi-spin pi-spinner' : 'pi-sign-out']"
                aria-hidden="true"
              ></i>
              {{ isSigningOut ? 'Signing out…' : 'Sign out of Funkollection' }}
            </button>
          </section>
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
.account-page {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: clamp(1.25rem, 3vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(138, 154, 91, 0.1), transparent 30rem),
    var(--funkollection-background);
  color: var(--funkollection-text);
}

.account-hero,
.account-layout,
.account-alert {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.account-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--funkollection-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.account-hero h1 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.08;
}

.hero-intro {
  max-width: 44rem;
  margin: 0.7rem 0 0;
  color: #5f625b;
}

.identity-summary {
  display: flex;
  min-width: 13rem;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(250, 243, 224, 0.55);
}

.identity-summary img,
.avatar-fallback {
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 2.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback,
.profile-fallback {
  display: grid;
  place-items: center;
  background: var(--funkollection-secondary);
  color: white;
  font-weight: 850;
}

.identity-summary > span:last-child {
  display: grid;
  min-width: 0;
}

.identity-summary strong,
.identity-summary small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-summary strong {
  color: var(--funkollection-primary);
  font-size: 0.84rem;
}

.identity-summary small {
  color: #6d716a;
  font-size: 0.7rem;
}

.account-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #e3b9ae;
  border-radius: 8px;
  background: #fff5f2;
  color: #7a3526;
}

.account-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(17rem, 0.75fr);
  gap: 1rem;
  align-items: start;
}

.account-main,
.account-side {
  display: grid;
  gap: 1rem;
}

.account-section {
  min-width: 0;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid rgba(47, 79, 79, 0.1);
}

.section-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  place-items: center;
  border-radius: 8px;
  background: rgba(138, 154, 91, 0.14);
  color: var(--funkollection-primary);
}

.section-heading h2 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
}

.section-heading p {
  margin: 0.2rem 0 0;
  color: #73776f;
  font-size: 0.78rem;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-block: 1.4rem;
}

.profile-summary img,
.profile-fallback {
  width: 4rem;
  height: 4rem;
  flex: 0 0 4rem;
  border-radius: 50%;
  object-fit: cover;
}

.profile-summary > div {
  display: grid;
  min-width: 0;
}

.profile-summary strong {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.2rem;
}

.profile-summary span {
  overflow-wrap: anywhere;
  color: #686c65;
  font-size: 0.8rem;
}

.detail-list,
.billing-details {
  margin: 0;
}

.detail-list > div,
.billing-details > div {
  display: grid;
  grid-template-columns: minmax(8rem, 0.7fr) minmax(0, 1.3fr);
  gap: 1rem;
  padding: 0.85rem 0;
  border-top: 1px solid rgba(47, 79, 79, 0.09);
}

dt {
  color: #767a73;
  font-size: 0.72rem;
  font-weight: 700;
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--funkollection-text);
  font-size: 0.8rem;
  font-weight: 700;
}

.plan-summary {
  display: grid;
  grid-template-columns: minmax(12rem, 0.7fr) minmax(0, 1.3fr);
  gap: 2rem;
  align-items: center;
  padding-block: 1.5rem;
}

.plan-label {
  color: #767a73;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.plan-summary h3 {
  margin: 0.15rem 0 0.65rem;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.8rem;
}

.plan-summary > p {
  margin: 0;
  color: #62665f;
  line-height: 1.7;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.55rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
}

.status-badge .pi {
  font-size: 0.42rem;
}

.status-badge--positive {
  background: #edf5e8;
  color: #476b3c;
}

.status-badge--warning {
  background: #fff5da;
  color: #7a5b12;
}

.status-badge--danger {
  background: #fff0ec;
  color: #8b3d2d;
}

.status-badge--neutral {
  background: #eef0eb;
  color: #5f655e;
}

.billing-details {
  border-block: 1px solid rgba(47, 79, 79, 0.1);
}

.billing-details > div:first-child {
  border-top: 0;
}

.admin-access-note {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin: 1rem 0 0;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(138, 154, 91, 0.1);
  color: #596050;
  font-size: 0.75rem;
  line-height: 1.55;
}

.admin-access-note i {
  color: var(--funkollection-secondary);
}

.billing-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem 1rem;
  padding-top: 1.25rem;
}

.billing-actions p {
  flex: 1 1 16rem;
  margin: 0;
  color: #777b74;
  font-size: 0.7rem;
  line-height: 1.5;
}

.primary-button,
.secondary-button,
.signout-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  border: 1px solid var(--funkollection-secondary);
  background: var(--funkollection-secondary);
  color: white;
}

.secondary-button {
  border: 1px solid rgba(47, 79, 79, 0.2);
  background: white;
  color: var(--funkollection-primary);
}

.primary-button:hover:not(:disabled) {
  border-color: var(--funkollection-primary);
  background: var(--funkollection-primary);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.setting-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.5rem;
  align-items: center;
  padding-top: 1.25rem;
}

.setting-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.setting-title strong {
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

.premium-feature-label {
  padding: 0.25rem 0.45rem;
  border-radius: 999px;
  background: rgba(138, 154, 91, 0.14);
  color: #64723d;
  font-size: 0.58rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.share-tool-row {
  margin-top: 1.25rem;
  padding: 1.1rem;
  border: 1px solid rgba(138, 154, 91, 0.28);
  border-radius: 10px;
  background: rgba(138, 154, 91, 0.055);
}

.access-unavailable {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #747970;
  font-size: 0.72rem;
  font-weight: 750;
}

.setting-row p,
.admin-callout p,
.security-note p {
  margin: 0.35rem 0 0;
  color: #72766f;
  font-size: 0.75rem;
  line-height: 1.6;
}

.admin-section {
  border-top: 3px solid var(--funkollection-secondary);
}

.admin-callout {
  padding-top: 1.2rem;
}

.admin-callout strong,
.security-note strong {
  color: var(--funkollection-primary);
  font-size: 0.85rem;
}

.security-note {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  padding-block: 1.2rem;
}

.security-note > i {
  color: var(--funkollection-secondary);
  font-size: 1.15rem;
}

.signout-action {
  width: 100%;
  border: 1px solid rgba(47, 79, 79, 0.18);
  background: transparent;
  color: var(--funkollection-primary);
}

.signout-action:hover:not(:disabled) {
  border-color: rgba(138, 58, 42, 0.3);
  background: #fff5f2;
  color: #7a3526;
}

.inline-state {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.2rem;
  padding: 1rem;
  border-radius: 8px;
}

.inline-state--error {
  border: 1px solid #e3b9ae;
  background: #fff5f2;
  color: #7a3526;
}

.inline-state div {
  display: grid;
  gap: 0.2rem;
}

.inline-state span {
  font-size: 0.75rem;
}

.account-loading {
  display: flex;
  min-height: 60vh;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.account-loading h1 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
}

.account-loading p {
  margin: 0.2rem 0 0;
  color: #686b64;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(138, 154, 91, 0.25);
  border-top-color: var(--funkollection-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

button:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.36);
  outline-offset: 3px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .account-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .account-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .account-side > :only-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .account-page {
    padding: 1rem;
  }

  .account-hero {
    align-items: stretch;
    flex-direction: column;
    gap: 1.25rem;
  }

  .identity-summary {
    min-width: 0;
  }

  .account-side {
    grid-template-columns: 1fr;
  }

  .plan-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 520px) {
  .account-page {
    padding-inline: 0.75rem;
  }

  .account-hero,
  .account-section {
    padding: 1.2rem;
  }

  .detail-list > div,
  .billing-details > div,
  .setting-row {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }

  .setting-row {
    gap: 1rem;
  }

  .secondary-button,
  .primary-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation-duration: 1.8s;
  }
}
</style>
