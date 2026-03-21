# Funkollection — Claude Code Project Context

## Project Overview
Funkollection is a Vue 3 SPA for tracking Funko Pop collections.
It uses Firebase for auth, Firestore, hosting, and cloud functions.
Stripe handles premium subscriptions. The app is live at funkollection.com.

---

## Tech Stack
- **Frontend:** Vue 3 (Composition API + `<script setup>`), Vite, Vue Router, Tailwind CSS, PrimeVue, PrimeIcons
- **Backend:** Firebase (Auth, Firestore, Hosting, Cloud Functions v2)
- **Payments:** Stripe (via `stripe-firebase-extensions`)
- **Chat AI:** Anthropic Claude claude-haiku-4-5 (via Firebase Function)
- **Other:** SheetJS (CSV/Excel import), marked (markdown rendering)

---

## Key File Paths
```
src/
  views/
    CollectionView.vue        # thin wrapper around CollectionTable
    FavoritesView.vue
    FunkoChatView.vue         # AI chat (premium)
    DashboardView.vue         # premium dashboard with cards
    FriendsView.vue           # friends management (premium)
    FriendCollectionView.vue  # read-only friend's collection
    BadgesView.vue            # achievement badges (premium)
    Account.vue
    AboutUs.vue
    PrivacyPolicy.vue
    TermsOfService.vue

  components/
    CollectionTable.vue       # main collection UI with add/edit/delete
    AddPopDialog.vue          # dialog to add a new Pop
    EditPopDialog.vue         # dialog to edit an existing Pop
    PaywallCard.vue           # shown when non-premium hits a premium feature
    StickerBreakdownCard.vue  # dashboard card
    PopCountCard.vue          # dashboard card
    PopCategoryBreakdownCard.vue
    BadgesCard.vue
    EstimatedValueCard.vue
    PopAcquisitionChart.vue
    RecentAdditionsCard.vue
    MostValuablePopsCard.vue

  composables/
    useUserFunkos.js          # reactive composable for user's funko collection
    useAuthUser.js            # reactive composable for current auth user

  firebase.js                 # Firebase app init and exports (db, auth, etc.)
  router/index.ts             # all routes defined here
  assets/
    main.css                  # global styles and CSS variable overrides
    base.css                  # base CSS variables

functions/
  index.js                    # all Firebase Cloud Functions
  .env                        # ANTHROPIC_KEY lives here (never commit)

.github/
  workflows/
    firebase-hosting-merge.yml  # auto-deploys to Firebase Hosting on push to main
                                # requires GitHub Secrets for VITE_FIREBASE_* vars

.env                            # VITE_FIREBASE_* variables (never commit)
firebase.json                   # Firebase config with predeploy build hook
firestore.rules                 # Firestore security rules
```

---

## Firestore Structure
```
FunkoPops/{popId}                          # global catalog (read-only for users)
  name, title, series, image

users/{uid}                                # user profile
  isAdmin, chatUsage, newBadges[]

users/{uid}/funkos/{popId}                 # user's owned Pops
  purchasePrice, stickers[], image, quantity

users/{uid}/favorites/{popId}              # user's favorited Pops

users/{uid}/badges/{badgeId}               # unlocked badges
  unlockedAt

users/{uid}/friends/{friendUid}            # friends list
  displayName, photoURL, addedAt

users/{uid}/friendRequests/{requestId}     # incoming friend requests
  from, fromName, fromPhoto, sentAt, status

users/{uid}/sentRequests/{targetUid}       # outgoing friend requests
  to, sentAt

customers/{uid}/subscriptions/{id}         # Stripe subscriptions (managed by extension)
```

---

## CSS Variables (defined in base.css)
```css
--funkollection-primary        /* dark green nav background */
--funkollection-secondary      /* medium green, used for buttons, badges, progress bars */
--funkollection-background     /* warm off-white page background */
--funkollection-text           /* dark text color */
--funkollection-soft-white     /* nav text color */
--funkollection-gradient       /* purple→pink→yellow gradient, used for premium accents */
```

Always use these variables instead of hardcoded colors to stay consistent with the theme.

---

## Premium / Auth Pattern
Every premium view follows this pattern:

```vue
<script setup>
const isPremium = ref(false)
const isLoadingUserData = ref(true)

onMounted(async () => {
  const currentUser = auth.currentUser
  const userDocRef = doc(db, 'users', currentUser.uid)
  const userDocSnap = await getDoc(userDocRef)

  if (userDocSnap.data()?.isAdmin) {
    isPremium.value = true
    isLoadingUserData.value = false
    return
  }

  const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions')
  onSnapshot(subscriptionsRef, (snapshot) => {
    isPremium.value = snapshot.docs.some(d => {
      const data = d.data()
      return data.status === 'active' || data.status === 'trialing'
    })
    isLoadingUserData.value = false
  })
})
</script>

<template>
  <div v-if="isLoadingUserData">Loading...</div>
  <div v-else-if="!isPremium"><PaywallCard feature-name="Feature Name" /></div>
  <div v-else><!-- premium content --></div>
</template>
```

- `isAdmin: true` on the user doc bypasses all premium checks
- Always check admin first, then subscriptions
- Always show a loading state while checking

---

## Firebase Cloud Functions
All functions are v2, deployed to us-central1, with `{ cors: true }`.

```
funkoChat              — AI chat using Claude claude-haiku-4-5, enforces 20msg/day limit
acceptFriendRequest    — server-side cross-user friend accept
declineFriendRequest   — server-side cross-user friend decline
unfriendUser           — server-side cross-user unfriend
```

**Deploy functions only:**
```powershell
firebase deploy --only functions
# Answer N to any function deletion prompts
```

**Never deploy functions from a branch** — always deploy from main or your local machine with the correct .env in functions/.env.

---

## Routing
All authenticated routes are children of the `DashboardLayout` component.
Routes requiring auth have `meta: { requiresAuth: true }`.

```typescript
// Pattern for adding a new route:
{
  path: 'your-route',
  name: 'yourRoute',
  component: YourView,
  meta: { requiresAuth: true }
}
```

---

## Nav Notification Badges
The nav in `Layout.vue` supports notification badges (red dot with count).
Currently used for: friend requests, new badges.

```vue
<span v-if="count > 0" class="nav-badge">{{ count }}</span>
```

CSS class `nav-badge` is already defined globally in `Layout.vue`.
To add a new notification, add an `onSnapshot` listener in `Layout.vue`'s `onMounted`.

---

## Badge System (BadgesView.vue)
Badges are defined in a `BADGES` array in `BadgesView.vue`.
They are checked and awarded on page load (not via Firebase Functions).

**Rules:**
- Never change a badge `id` once deployed — it is the Firestore key
- Safe to change: `label`, `icon`, `desc`
- Never change `req.type` or `req.value` — unfair to existing users

**Supported req.types:**
- `count` — total Pops owned
- `series` — unique series count
- `value` — total $ spent (sum of purchasePrice)
- `favorites` — number of favorited Pops

**To add a new req.type:** fetch the data in `onMounted`, add to `badgeProgress`, add `if (type === 'x')` in the evaluation loop.

---

## Deployment
```
git push to main     → GitHub Actions builds with secrets → deploys to Firebase Hosting
firebase deploy      → manual deploy from local machine (use when GitHub deploy breaks)
```

**GitHub Secrets required for CI to work:**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Never commit:**
- `.env` (root) — contains VITE_FIREBASE_* keys
- `functions/.env` — contains ANTHROPIC_KEY
- `.firebase/` — local hosting cache, add to .gitignore

---

## Mobile Breakpoint
```css
@media (max-width: 768px) { /* mobile styles */ }
@media (min-width: 768px) { /* desktop styles */ }
```
Mobile header height is 48px. Main content has `padding-top: 48px` on mobile to account for fixed header.

---

## Frontend Design Guidelines
Refer to `docs/funkollection_brand_guidelines.png` for the full visual identity reference.

Key rules:
- Always use CSS variables instead of hardcoded colors (defined in `src/assets/base.css`)
- Use `var(--funkollection-secondary)` for buttons, badges, progress bars, active states
- Use `var(--funkollection-primary)` for dark backgrounds (nav, headers)
- Use `var(--funkollection-background)` for page backgrounds
- Use `var(--funkollection-gradient)` for premium accents only
- Border radius: 8px buttons, 12px cards, 16px larger containers, 999px pills/badges
- Shadows: `box-shadow: 0 2px 8px rgba(0,0,0,0.06)` for cards
- Typography: Playfair Display for headings/logo, Sora for UI/nav/buttons, DM Sans for body
- Mobile breakpoint: `@media (max-width: 768px)` — mobile header is 48px fixed
- Always use `<style scoped>` in Vue components
- Match the warm, natural aesthetic — avoid cold blues or generic grays

---

## Backlog (as of March 2026)
- eBay API for market value (per-Pop + cached dashboard widget)
- Trading feature (1-for-1 swap between friends)
- Wishlist feature (needs external API/catalog)
- Series completion tracker (needs external API)
- Remove all console.log statements before final production launch
- Add real contact email to Privacy Policy and Terms of Service
- Complete Stripe account verification for payouts
- Collection value share card (html2canvas, branded with Funkollection)
- Duplicate Pop warning in AddPopDialog (prompt before upping quantity)
- Collection leaderboard (top 5 by Pop count, top 5 by collection value — opt-in)
- SEO improvements (meta tags, Open Graph, sitemap.xml)
- Public collection sharing (shareable link, good for SEO + viral growth)
