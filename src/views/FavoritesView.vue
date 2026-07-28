<script setup>
import { onMounted, ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import AppEmptyState from '@/components/AppEmptyState.vue'
import AppPageHeader from '@/components/AppPageHeader.vue'
import PopDetailsDialog from '@/components/PopDetailsDialog.vue'

const user = ref(null)
const favorites = ref([])
const loading = ref(true)
const viewedFunko = ref(null)
const showViewDialog = ref(false)
const removingId = ref('')
const toast = useToast()

async function fetchFavorites() {
  if (!user.value) return
  const favSnapshot = await getDocs(collection(db, 'users', user.value.uid, 'favorites'))
  const funkoDetails = await Promise.all(
    favSnapshot.docs.map(async (favDoc) => {
      const favoriteData = favDoc.data()
      const favoriteKey = favDoc.id
      const favoriteFunkoId = favoriteData?.funkoId || null

      if (favoriteData?.funkoDocId) {
        const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', favoriteData.funkoDocId)
        const userFunkoSnap = await getDoc(userFunkoRef)
        if (userFunkoSnap.exists()) {
          const userFunko = userFunkoSnap.data()
          let catalogImage = ''
          if (userFunko.funkoId) {
            const catalogQuery = query(
              collection(db, 'FunkoPops'),
              where('funkoId', '==', userFunko.funkoId),
            )
            const catalogSnapshot = await getDocs(catalogQuery)
            if (!catalogSnapshot.empty) catalogImage = catalogSnapshot.docs[0].data().image || ''
          }
          return {
            docId: favoriteKey,
            id: userFunko.funkoId || favoriteFunkoId || favoriteKey,
            name: userFunko.name || '',
            title: userFunko.title || '',
            series: userFunko.series || '',
            image: userFunko.image || catalogImage || '',
            purchasePrice: userFunko.purchasePrice !== undefined ? userFunko.purchasePrice : '',
          }
        }
      }

      if (favoriteFunkoId) {
        const catalogQuery = query(
          collection(db, 'FunkoPops'),
          where('funkoId', '==', favoriteFunkoId),
        )
        const catalogSnapshot = await getDocs(catalogQuery)
        if (!catalogSnapshot.empty) {
          const data = catalogSnapshot.docs[0].data()
          return {
            docId: favoriteKey,
            id: favoriteFunkoId,
            name: data.name || '',
            title: data.title || '',
            series: data.series || '',
            image: data.image || '',
            purchasePrice: '',
          }
        }
      }

      return {
        docId: favoriteKey,
        id: favoriteFunkoId || favoriteKey,
        name: favoriteData?.name || '',
        title: favoriteData?.title || '',
        series: favoriteData?.series || '',
        image: favoriteData?.image || '',
        purchasePrice: favoriteData?.purchasePrice ?? '',
      }
    }),
  )
  favorites.value = funkoDetails
}

function viewFunko(funko) {
  viewedFunko.value = funko
  showViewDialog.value = true
}

async function removeFavorite(funko) {
  if (!user.value || !funko.docId) return
  removingId.value = funko.docId
  try {
    await deleteDoc(doc(db, 'users', user.value.uid, 'favorites', funko.docId))
    favorites.value = favorites.value.filter((favorite) => favorite.docId !== funko.docId)
    toast.add({
      severity: 'info',
      summary: 'Removed from favorites',
      detail: funko.name || funko.title,
      life: 2500,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Could not update favorites',
      detail: 'Please try again.',
      life: 3000,
    })
  } finally {
    removingId.value = ''
  }
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (user.value) await fetchFavorites()
    loading.value = false
  })
})
</script>

<template>
  <main class="feature-page">
    <AppPageHeader
      eyebrow="Curated collection"
      title="Favorites"
      description="Keep the Pops you care about most close at hand, with quick access to their collection details."
      icon="pi-heart-fill"
    />

    <section class="favorites-panel" aria-labelledby="favorites-heading">
      <header class="section-header">
        <div>
          <p class="section-kicker">Your shortlist</p>
          <h2 id="favorites-heading">
            {{ favorites.length }} favorite{{ favorites.length === 1 ? '' : 's' }}
          </h2>
        </div>
        <span class="pi pi-heart-fill favorite-mark" aria-hidden="true"></span>
      </header>

      <div v-if="loading" class="favorites-skeleton" aria-live="polite">
        <span v-for="index in 4" :key="index"></span>
      </div>

      <AppEmptyState
        v-else-if="favorites.length === 0"
        icon="pi-heart"
        title="No favorites yet"
        description="Use the heart action in your collection to build a personal shortlist of standout Pops."
      >
        <RouterLink class="collection-link" to="/collection">Browse your collection</RouterLink>
      </AppEmptyState>

      <div v-else class="favorites-grid">
        <article v-for="funko in favorites" :key="funko.docId || funko.id" class="favorite-card">
          <div class="image-wrap">
            <img
              :src="funko.image || '/placeholder.svg'"
              :alt="funko.name ? `${funko.name} collectible` : 'Funko Pop collectible'"
            />
            <span class="favorite-badge"
              ><i class="pi pi-heart-fill" aria-hidden="true"></i> Favorite</span
            >
          </div>
          <div class="favorite-copy">
            <p class="series">{{ funko.series || 'Series not recorded' }}</p>
            <h3>{{ funko.name || 'Unnamed Pop' }}</h3>
            <p class="title">{{ funko.title || 'No title recorded' }}</p>
          </div>
          <div class="favorite-actions">
            <Button label="View details" icon="pi pi-eye" outlined @click="viewFunko(funko)" />
            <Button
              icon="pi pi-heart-fill"
              text
              severity="danger"
              :loading="removingId === funko.docId"
              aria-label="Remove from favorites"
              @click="removeFavorite(funko)"
            />
          </div>
        </article>
      </div>
    </section>

    <PopDetailsDialog v-model:visible="showViewDialog" :funko="viewedFunko" />
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

.favorites-panel {
  margin-top: 1rem;
  padding: clamp(1.15rem, 2vw, 1.5rem);
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 8px rgba(47, 79, 79, 0.06);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-kicker,
.series {
  margin: 0 0 0.15rem;
  color: var(--funkollection-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h2,
h3 {
  margin: 0;
  color: var(--funkollection-primary);
  font-family: 'Playfair Display', Georgia, serif;
}

h2 {
  font-size: 1.45rem;
}

h3 {
  font-size: 1.25rem;
}

.favorite-mark {
  color: #9b4b46;
  font-size: 1.3rem;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.favorite-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(47, 79, 79, 0.12);
  border-radius: 12px;
  background: white;
}

.image-wrap {
  position: relative;
  display: grid;
  min-height: 12rem;
  padding: 1rem;
  place-items: center;
  background: #f6f3e8;
}

.image-wrap img {
  width: 100%;
  height: 11rem;
  object-fit: contain;
}

.favorite-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: white;
  color: #8b423e;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(47, 79, 79, 0.1);
}

.favorite-copy {
  flex: 1;
  padding: 1rem;
}

.title {
  margin: 0.25rem 0 0;
  color: #73776e;
  font-size: 0.88rem;
}

.favorite-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(47, 79, 79, 0.1);
}

.collection-link {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  background: var(--funkollection-secondary);
  color: white;
  font-weight: 700;
  text-decoration: none;
}

.favorites-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.favorites-skeleton span {
  height: 20rem;
  border-radius: 12px;
  background: #eceee8;
}

@media (max-width: 768px) {
  .feature-page {
    padding: 1rem;
  }

  .favorites-grid,
  .favorites-skeleton {
    grid-template-columns: 1fr;
  }
}
</style>
