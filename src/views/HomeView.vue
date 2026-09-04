<script setup>
import { ref } from 'vue'
import flashImg from '../assets/img/funkoPop_Flash.png'
import { auth, provider, db } from '@/firebase.js'
import { signInWithPopup } from 'firebase/auth'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSigningIn = ref(false)
const authError = ref('')
const currentYear = new Date().getFullYear()

async function syncUserProfile(user) {
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {
    // Profile metadata is supplementary and must not turn a successful
    // Firebase authentication into a failed sign-in experience.
  }
}

const signInWithGoogle = async () => {
  if (isSigningIn.value) return

  isSigningIn.value = true
  authError.value = ''

  try {
    const user = auth.currentUser || (await signInWithPopup(auth, provider)).user
    await syncUserProfile(user)
    await router.push('/collection')
  } catch (error) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request')
      return
    if (error?.code === 'auth/popup-blocked') {
      authError.value = 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.'
      return
    }
    if (error?.code === 'auth/unauthorized-domain') {
      authError.value = 'Google sign-in is not enabled for this site address.'
      return
    }
    if (error?.code === 'auth/network-request-failed') {
      authError.value = 'Google sign-in could not reach the network. Check your connection and try again.'
      return
    }
    authError.value = 'We could not sign you in. Please try again in a moment.'
  } finally {
    isSigningIn.value = false
  }
}

const features = [
  {
    icon: 'pi-box',
    title: 'Collection management',
    text: 'Keep each Pop and its details in one searchable, organized collection.',
  },
  {
    icon: 'pi-search',
    title: 'Search and favorites',
    text: 'Find what you own quickly and keep the Pops you care about close at hand.',
  },
  {
    icon: 'pi-chart-bar',
    title: 'Collection insights',
    text: 'Understand the shape of your collection with a focused analytics dashboard.',
  },
  {
    icon: 'pi-trophy',
    title: 'Collector badges',
    text: 'Mark collection milestones and see the progress you have made over time.',
  },
  {
    icon: 'pi-users',
    title: 'Collector connections',
    text: 'Connect with friends and make collecting feel a little less solitary.',
  },
  {
    icon: 'pi-comments',
    title: 'Funko Chat',
    text: 'Ask collection-aware questions without digging through every saved item.',
  },
]

const faqs = [
  {
    question: 'What can I do with Funkollection?',
    answer:
      'You can organize your Funko Pops, search your collection, save favorites, explore analytics and badges, connect with friends, and use Funko Chat.',
  },
  {
    question: 'Is Funkollection free?',
    answer:
      'Yes. Funkollection is currently free to use after you sign in.',
  },
  {
    question: 'How do I sign in?',
    answer:
      'Funkollection uses Google sign-in, so there is no additional password to create or remember.',
  },
  {
    question: 'Will my collection work on mobile?',
    answer:
      'Yes. Funkollection is designed to work across desktop, tablet, and mobile screens, so your collection can go to the store with you.',
  },
  {
    question: 'Does Funkollection provide live market values?',
    answer:
      'Not currently. Funkollection tracks the collection details and purchase information you enter; it does not present estimated live market prices.',
  },
]
</script>

<template>
  <div class="landing-page">
    <header class="landing-nav">
      <a class="brand" href="#top" aria-label="Funkollection home">
        <span class="brand-mark" aria-hidden="true">F</span>
        <span>Funkollection</span>
      </a>

      <nav class="nav-links" aria-label="Landing page navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#features">Features</a>
        <a href="#faq">FAQ</a>
      </nav>

      <button class="button button-small button-dark" type="button" :disabled="isSigningIn" @click="signInWithGoogle">
        <i v-if="isSigningIn" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ isSigningIn ? 'Signing in…' : 'Sign in' }}</span>
      </button>
    </header>

    <main id="top">
      <section class="hero section-shell" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">A better home for every Pop</p>
          <h1 id="hero-title">Know your collection.<br />Enjoy it more.</h1>
          <p class="hero-lede">
            Funkollection gives Funko Pop collectors one clear place to track what they own,
            find favorites, and understand the collection they have built.
          </p>

          <div class="hero-actions">
            <button class="button button-primary" type="button" :disabled="isSigningIn" @click="signInWithGoogle">
              <i v-if="isSigningIn" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
              <span>{{ isSigningIn ? 'Signing in…' : 'Start your collection' }}</span>
              <i v-if="!isSigningIn" class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
            <a class="text-link" href="#how-it-works">See how it works <i class="pi pi-arrow-down" aria-hidden="true"></i></a>
          </div>

          <p class="sign-in-note"><i class="pi pi-shield" aria-hidden="true"></i> Secure sign-in with Google</p>
          <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>
        </div>

        <div class="preview-wrap">
          <div class="product-preview" aria-label="Interface preview of Funkollection">
            <div class="preview-topbar">
              <span class="preview-logo">F</span>
              <span class="preview-search"><i class="pi pi-search" aria-hidden="true"></i> Search your collection</span>
              <span class="preview-avatar" aria-hidden="true"></span>
            </div>
            <div class="preview-body">
              <aside class="preview-sidebar" aria-hidden="true">
                <span class="active"><i class="pi pi-th-large"></i> Overview</span>
                <span><i class="pi pi-box"></i> Collection</span>
                <span><i class="pi pi-heart"></i> Favorites</span>
                <span><i class="pi pi-chart-bar"></i> Insights</span>
              </aside>
              <div class="preview-content">
                <div class="preview-heading">
                  <div>
                    <small>YOUR COLLECTION</small>
                    <strong>Everything in its place.</strong>
                  </div>
                  <span class="preview-add"><i class="pi pi-plus"></i> Add Pop</span>
                </div>
                <div class="preview-grid">
                  <article class="preview-pop-card">
                    <span class="preview-image-halo"></span>
                    <img :src="flashImg" alt="The Flash Funko Pop used in the interface preview" />
                    <div>
                      <small>COLLECTION ITEM</small>
                      <strong>Your Pops, easy to find</strong>
                      <span>Details stay with every item.</span>
                    </div>
                  </article>
                  <article class="preview-insight-card">
                    <small>AT A GLANCE</small>
                    <strong>See the collection clearly</strong>
                    <div class="preview-bars" aria-hidden="true">
                      <span style="--bar-size: 72%"></span>
                      <span style="--bar-size: 48%"></span>
                      <span style="--bar-size: 86%"></span>
                    </div>
                    <span class="preview-caption">Organized details. Useful insights.</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
          <p class="preview-label">Interface preview — your workspace uses your own saved collection data.</p>
        </div>
      </section>

      <section class="confidence-strip" aria-label="Product benefits">
        <span><i class="pi pi-check-circle" aria-hidden="true"></i> Google sign-in</span>
        <span><i class="pi pi-cloud" aria-hidden="true"></i> Cloud-synced collection</span>
        <span><i class="pi pi-mobile" aria-hidden="true"></i> Ready for the store aisle</span>
      </section>

      <section id="how-it-works" class="section-shell content-section">
        <div class="section-intro">
          <p class="eyebrow">From shelf to searchable</p>
          <h2>Less second-guessing. More collecting.</h2>
          <p>
            Replace scattered notes and “do I already own this?” moments with a collection
            that is easy to check and simple to maintain.
          </p>
        </div>

        <div class="steps-grid">
          <article>
            <span class="step-number">01</span>
            <i class="pi pi-google step-icon" aria-hidden="true"></i>
            <h3>Sign in securely</h3>
            <p>Use your Google account to create your collection workspace.</p>
          </article>
          <article>
            <span class="step-number">02</span>
            <i class="pi pi-plus-circle step-icon" aria-hidden="true"></i>
            <h3>Add the Pops you own</h3>
            <p>Save the details that help you recognize, organize, and revisit each item.</p>
          </article>
          <article>
            <span class="step-number">03</span>
            <i class="pi pi-compass step-icon" aria-hidden="true"></i>
            <h3>Use your collection</h3>
            <p>Search before you buy, revisit favorites, and see your collecting progress.</p>
          </article>
        </div>
      </section>

      <section id="features" class="features-section">
        <div class="section-shell">
          <div class="section-intro section-intro-centered">
            <p class="eyebrow">Built around the collection</p>
            <h2>The useful tools. None of the clutter.</h2>
            <p>Every feature helps you keep track, find an answer, or better understand what you own.</p>
          </div>

          <div class="features-grid">
            <article v-for="feature in features" :key="feature.title" class="feature-card">
              <div class="feature-icon-wrap"><i class="pi" :class="feature.icon" aria-hidden="true"></i></div>
              <div class="feature-title-row">
                <h3>{{ feature.title }}</h3>
              </div>
              <p>{{ feature.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section-shell trust-section">
        <div>
          <p class="eyebrow">Confidence by design</p>
          <h2>Your collection should feel dependable.</h2>
          <p>
            Your Funkollection workspace is tied to your Google sign-in and saved in the cloud,
            so the collection you update at home is there when you need it on the go.
          </p>
          <RouterLink class="text-link" to="/privacypolicy">Read the privacy policy <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
        </div>
        <ul class="trust-list">
          <li><i class="pi pi-lock" aria-hidden="true"></i><span><strong>No extra password</strong>Google handles authentication.</span></li>
          <li><i class="pi pi-sync" aria-hidden="true"></i><span><strong>One consistent collection</strong>Your saved items follow your account.</span></li>
          <li><i class="pi pi-eye" aria-hidden="true"></i><span><strong>Honest product scope</strong>No invented market estimates or fabricated collector claims.</span></li>
        </ul>
      </section>

      <section id="faq" class="section-shell faq-section">
        <div class="section-intro">
          <p class="eyebrow">Common questions</p>
          <h2>Know what to expect.</h2>
        </div>
        <div class="faq-list">
          <details v-for="(faq, index) in faqs" :key="faq.question" :open="index === 0">
            <summary>{{ faq.question }}<i class="pi pi-plus" aria-hidden="true"></i></summary>
            <p>{{ faq.answer }}</p>
          </details>
        </div>
      </section>

      <section class="final-cta">
        <div class="section-shell final-cta-inner">
          <p class="eyebrow">Your shelf, with a system</p>
          <h2>Build a collection you can actually use.</h2>
          <p>Sign in with Google and bring the Pops you own into one clear, searchable place.</p>
          <button class="button button-light" type="button" :disabled="isSigningIn" @click="signInWithGoogle">
            <i v-if="isSigningIn" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            <span>{{ isSigningIn ? 'Signing in…' : 'Start your collection' }}</span>
            <i v-if="!isSigningIn" class="pi pi-arrow-right" aria-hidden="true"></i>
          </button>
          <p v-if="authError" class="auth-error auth-error-light" role="alert">{{ authError }}</p>
        </div>
      </section>
    </main>

    <footer class="landing-footer">
      <div class="section-shell footer-inner">
        <div>
          <a class="brand" href="#top" aria-label="Back to the top">
            <span class="brand-mark" aria-hidden="true">F</span>
            <span>Funkollection</span>
          </a>
          <p>A clearer way to care for the collection you love.</p>
        </div>
        <nav aria-label="Legal and company links">
          <RouterLink to="/aboutus">About</RouterLink>
          <RouterLink to="/termsofservice">Terms</RouterLink>
          <RouterLink to="/privacypolicy">Privacy</RouterLink>
        </nav>
        <p class="copyright">© {{ currentYear }} Funkollection</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  --landing-ink: #263636;
  --landing-muted: #66716d;
  --landing-line: rgba(47, 79, 79, 0.14);
  --landing-surface: #fffdf8;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--landing-ink);
  background:
    radial-gradient(circle at 88% 7%, rgba(138, 154, 91, 0.14), transparent 24rem),
    var(--funkollection-background);
  font-family: 'Libre Baskerville', serif;
}

.section-shell {
  width: min(1180px, calc(100% - 3rem));
  margin-inline: auto;
}

.landing-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  min-height: 72px;
  padding: 0.75rem max(1.5rem, calc((100vw - 1180px) / 2));
  border-bottom: 1px solid var(--landing-line);
  background: rgba(250, 243, 224, 0.9);
  backdrop-filter: blur(16px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  width: fit-content;
  color: var(--landing-ink);
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 800;
  text-decoration: none;
}

.brand-mark,
.preview-logo {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
  color: #fff;
  background: var(--funkollection-primary);
  font-family: 'Playfair Display', serif;
  font-weight: 900;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a,
.landing-footer nav a {
  color: var(--landing-muted);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
}

.nav-links a:hover,
.landing-footer nav a:hover {
  color: var(--funkollection-primary);
}

.landing-nav > .button {
  justify-self: end;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 48px;
  padding: 0.85rem 1.15rem;
  border: 0;
  border-radius: 0.75rem;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.button:focus-visible,
a:focus-visible,
summary:focus-visible {
  outline: 3px solid rgba(138, 154, 91, 0.48);
  outline-offset: 3px;
}

.button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.button-small {
  min-height: 40px;
  padding: 0.65rem 1rem;
}

.button-dark {
  color: #fff;
  background: var(--funkollection-primary);
}

.button-primary {
  color: #fff;
  background: var(--funkollection-primary);
  box-shadow: 0 12px 28px rgba(47, 79, 79, 0.2);
}

.button-primary:hover:not(:disabled),
.button-dark:hover:not(:disabled) {
  background: #243f3f;
  box-shadow: 0 14px 32px rgba(47, 79, 79, 0.24);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.87fr) minmax(500px, 1.13fr);
  gap: clamp(3rem, 7vw, 6.5rem);
  align-items: center;
  min-height: calc(100vh - 72px);
  padding-block: 5rem;
}

.eyebrow {
  margin: 0 0 1rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: var(--landing-ink);
  font-family: 'Playfair Display', serif;
  font-weight: 800;
  letter-spacing: -0.035em;
}

h1 {
  max-width: 720px;
  font-size: clamp(3rem, 5.8vw, 5.8rem);
  line-height: 0.98;
}

h2 {
  font-size: clamp(2.25rem, 4vw, 3.75rem);
  line-height: 1.05;
}

h3 {
  margin: 0;
  color: var(--landing-ink);
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
}

.hero-lede,
.section-intro > p:last-child,
.trust-section > div > p:not(.eyebrow),
.final-cta-inner > p:not(.eyebrow, .auth-error) {
  color: var(--landing-muted);
  line-height: 1.8;
}

.hero-lede {
  max-width: 600px;
  margin: 1.75rem 0 0;
  font-size: clamp(1rem, 1.4vw, 1.18rem);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  color: var(--funkollection-primary);
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}

.text-link:hover {
  text-decoration: underline;
  text-underline-offset: 0.3rem;
}

.sign-in-note,
.preview-label {
  color: #7a827f;
  font-size: 0.68rem;
}

.sign-in-note {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  margin: 1rem 0 0.25rem;
}

.auth-error {
  max-width: 450px;
  margin: 0.75rem 0 0;
  color: #9c3f36;
  font-size: 0.78rem;
  line-height: 1.5;
}

.product-preview {
  overflow: hidden;
  border: 1px solid rgba(47, 79, 79, 0.16);
  border-radius: 1.1rem;
  background: rgba(255, 253, 248, 0.92);
  box-shadow: 0 28px 70px rgba(55, 65, 60, 0.17);
  transform: perspective(1400px) rotateY(-2deg) rotateX(1deg);
}

.preview-topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  min-height: 58px;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--landing-line);
}

.preview-logo {
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 0.55rem;
  font-size: 0.8rem;
}

.preview-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 250px;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--landing-line);
  border-radius: 0.6rem;
  color: #8a918e;
  background: #fff;
  font-size: 0.58rem;
}

.preview-avatar {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #dce2cc, var(--funkollection-secondary));
}

.preview-body {
  display: grid;
  grid-template-columns: 115px 1fr;
  min-height: 390px;
}

.preview-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.1rem 0.7rem;
  border-right: 1px solid var(--landing-line);
  background: rgba(47, 79, 79, 0.025);
}

.preview-sidebar span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem;
  border-radius: 0.5rem;
  color: #7b8480;
  font-size: 0.55rem;
  font-weight: 700;
}

.preview-sidebar .active {
  color: var(--funkollection-primary);
  background: rgba(138, 154, 91, 0.14);
}

.preview-content {
  padding: 1.5rem;
}

.preview-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.preview-heading div {
  display: grid;
  gap: 0.35rem;
}

.preview-heading small,
.preview-pop-card small,
.preview-insight-card small {
  color: var(--funkollection-secondary);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.preview-heading strong {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
}

.preview-add {
  padding: 0.52rem 0.7rem;
  border-radius: 0.5rem;
  color: #fff;
  background: var(--funkollection-primary);
  font-size: 0.5rem;
  font-weight: 700;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 0.8rem;
  margin-top: 1.2rem;
}

.preview-pop-card,
.preview-insight-card {
  position: relative;
  min-height: 245px;
  overflow: hidden;
  border: 1px solid var(--landing-line);
  border-radius: 0.85rem;
  background: #fff;
}

.preview-pop-card img {
  position: absolute;
  z-index: 1;
  top: -0.65rem;
  right: -1rem;
  width: 82%;
  height: 78%;
  object-fit: contain;
}

.preview-image-halo {
  position: absolute;
  top: 1rem;
  right: 0.5rem;
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(138, 154, 91, 0.3), rgba(47, 79, 79, 0.08));
}

.preview-pop-card div {
  position: absolute;
  z-index: 2;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  display: grid;
  gap: 0.4rem;
}

.preview-pop-card strong,
.preview-insight-card strong {
  font-size: 0.7rem;
}

.preview-pop-card div > span,
.preview-caption {
  color: #7a827f;
  font-size: 0.52rem;
}

.preview-insight-card {
  display: flex;
  flex-direction: column;
  padding: 1.1rem;
}

.preview-insight-card strong {
  margin-top: 0.45rem;
}

.preview-bars {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-block: auto;
}

.preview-bars span {
  position: relative;
  width: 100%;
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: #eef0e8;
}

.preview-bars span::after {
  content: '';
  display: block;
  width: var(--bar-size);
  height: 100%;
  border-radius: inherit;
  background: var(--funkollection-secondary);
}

.preview-label {
  margin: 0.8rem 0 0;
  text-align: center;
}

.confidence-strip {
  display: flex;
  justify-content: center;
  gap: clamp(2rem, 7vw, 7rem);
  padding: 1.4rem 1.5rem;
  border-block: 1px solid var(--landing-line);
  color: var(--landing-muted);
  background: rgba(255, 253, 248, 0.55);
  font-size: 0.72rem;
  font-weight: 700;
}

.confidence-strip span {
  display: flex;
  gap: 0.55rem;
  align-items: center;
}

.confidence-strip i {
  color: var(--funkollection-secondary);
}

.content-section,
.faq-section {
  padding-block: clamp(5rem, 9vw, 8rem);
}

.section-intro {
  max-width: 710px;
}

.section-intro > p:last-child {
  max-width: 650px;
  margin: 1.25rem 0 0;
}

.section-intro-centered {
  margin-inline: auto;
  text-align: center;
}

.section-intro-centered > p:last-child {
  margin-inline: auto;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 3rem;
}

.steps-grid article {
  position: relative;
  min-height: 235px;
  padding: 1.6rem;
  border: 1px solid var(--landing-line);
  border-radius: 0.9rem;
  background: rgba(255, 253, 248, 0.66);
}

.step-number {
  position: absolute;
  top: 1.3rem;
  right: 1.4rem;
  color: rgba(47, 79, 79, 0.18);
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 800;
}

.step-icon,
.feature-icon-wrap {
  display: grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 0.7rem;
  color: var(--funkollection-primary);
  background: rgba(138, 154, 91, 0.15);
}

.steps-grid h3 {
  margin-top: 2.4rem;
}

.steps-grid p,
.feature-card p {
  margin: 0.8rem 0 0;
  color: var(--landing-muted);
  font-size: 0.82rem;
  line-height: 1.75;
}

.features-section {
  padding-block: clamp(5rem, 9vw, 8rem);
  border-block: 1px solid var(--landing-line);
  background: rgba(255, 253, 248, 0.62);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 3rem;
}

.feature-card {
  padding: 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 24px rgba(55, 65, 60, 0.05);
}

.feature-card:hover {
  border-color: var(--landing-line);
}

.feature-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.15rem;
}

.trust-section {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(3rem, 8vw, 8rem);
  align-items: center;
  padding-block: clamp(5rem, 9vw, 8rem);
}

.trust-section > div > p:not(.eyebrow) {
  margin: 1.25rem 0 1.5rem;
}

.trust-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-block: 1px solid var(--landing-line);
}

.trust-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding: 1.3rem 0.5rem;
  border-bottom: 1px solid var(--landing-line);
}

.trust-list li:last-child {
  border-bottom: 0;
}

.trust-list i {
  color: var(--funkollection-secondary);
  font-size: 1.1rem;
}

.trust-list span {
  display: grid;
  gap: 0.35rem;
  color: var(--landing-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.trust-list strong {
  color: var(--landing-ink);
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
}

.faq-section {
  display: grid;
  grid-template-columns: 0.72fr 1.28fr;
  gap: clamp(3rem, 8vw, 8rem);
}

.faq-list {
  border-top: 1px solid var(--landing-line);
}

.faq-list details {
  border-bottom: 1px solid var(--landing-line);
}

.faq-list summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 0;
  color: var(--landing-ink);
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}

.faq-list summary::-webkit-details-marker {
  display: none;
}

.faq-list details[open] summary i {
  transform: rotate(45deg);
}

.faq-list summary i {
  color: var(--funkollection-secondary);
  transition: transform 180ms ease;
}

.faq-list details p {
  max-width: 640px;
  margin: -0.25rem 2.5rem 1.35rem 0;
  color: var(--landing-muted);
  font-size: 0.8rem;
  line-height: 1.75;
}

.final-cta {
  color: #fff;
  background:
    radial-gradient(circle at 80% 20%, rgba(138, 154, 91, 0.35), transparent 21rem),
    var(--funkollection-primary);
}

.final-cta-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: clamp(4.5rem, 8vw, 7rem);
  text-align: center;
}

.final-cta .eyebrow {
  color: #cbd5ae;
}

.final-cta h2,
.final-cta-inner > p:not(.eyebrow, .auth-error) {
  color: #fff;
}

.final-cta-inner > p:not(.eyebrow, .auth-error) {
  max-width: 600px;
  margin: 1.2rem 0 1.75rem;
  opacity: 0.76;
}

.button-light {
  color: var(--funkollection-primary);
  background: #fffdf8;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.auth-error-light {
  color: #ffe2dc;
}

.landing-footer {
  background: #fffdf8;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 3rem;
  padding-block: 2.5rem;
}

.footer-inner > div > p,
.copyright {
  margin: 0.7rem 0 0;
  color: var(--landing-muted);
  font-size: 0.68rem;
}

.landing-footer nav {
  display: flex;
  gap: 1.5rem;
}

.copyright {
  margin: 0;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-copy {
    max-width: 720px;
  }

  .preview-wrap {
    max-width: 720px;
  }

  .product-preview {
    transform: none;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .section-shell {
    width: min(100% - 2rem, 1180px);
  }

  .landing-nav {
    grid-template-columns: 1fr auto;
    padding-inline: 1rem;
  }

  .nav-links {
    display: none;
  }

  .brand {
    font-size: 1rem;
  }

  .hero {
    gap: 3rem;
    padding-block: 4rem;
  }

  h1 {
    font-size: clamp(2.65rem, 13vw, 4.25rem);
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .confidence-strip {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.9rem;
    padding-inline: 1rem;
  }

  .preview-sidebar {
    display: none;
  }

  .preview-body {
    grid-template-columns: 1fr;
    min-height: 350px;
  }

  .preview-content {
    padding: 1rem;
  }

  .preview-grid {
    grid-template-columns: 1fr 0.75fr;
  }

  .preview-insight-card {
    padding: 0.8rem;
  }

  .steps-grid,
  .features-grid,
  .trust-section,
  .faq-section {
    grid-template-columns: 1fr;
  }

  .steps-grid article {
    min-height: auto;
  }

  .trust-section,
  .faq-section {
    gap: 2.5rem;
  }

  .footer-inner {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .landing-nav .brand span:last-child {
    display: none;
  }

  .preview-search {
    overflow: hidden;
    white-space: nowrap;
  }

  .preview-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .preview-grid {
    grid-template-columns: 1fr;
  }

  .preview-insight-card {
    display: none;
  }

  .preview-pop-card {
    min-height: 220px;
  }

  .feature-card {
    padding: 1.25rem;
  }

  .landing-footer nav {
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
