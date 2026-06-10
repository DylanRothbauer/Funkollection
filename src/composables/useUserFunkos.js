import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

const user = ref(null)
const funkos = ref([])
const loading = ref(true)
const error = ref(null)
let initialized = false

async function fetchUserFunkos() {
  if (!user.value) return []
  const snapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
  return snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }))
}

async function fetchFunkos() {
  if (!user.value) {
    funkos.value = []
    loading.value = false
    return
  }
  loading.value = true
  error.value = null

  try {
    const userFunkos = await fetchUserFunkos()

    funkos.value = userFunkos.map((u) => ({
      docId: u.docId,
      id: u.funkoId || u.docId, // prefer funkoId, fall back to docId
      name: u.name || '',
      title: u.title || '',
      series: u.series || '',
      image: u.image || '',
      purchasePrice: u.purchasePrice ?? '',
      stickers: u.stickers || [],
      quantity: u.quantity || 1,
      addedAt: u.addedAt || null,
    }))
  } catch (e) {
    error.value = e
  }
  loading.value = false
}

async function addFunkoPop({ id, name, title, series, image, purchasePrice, stickers = [] }) {
  if (!user.value) throw new Error('Not authenticated')

  // Write to global catalog with auto-generated key
  // If id is empty/blank, match on name + title only to avoid duplicates
  const catalogRef = collection(db, 'FunkoPops')
  const hasId = id?.trim() !== ''

  const catalogQuery = hasId
  ? query(catalogRef, where('funkoId', '==', id), where('name', '==', name), where('title', '==', title))
  : query(catalogRef, where('name', '==', name), where('title', '==', title), where('series', '==', series))

  const catalogSnap = await getDocs(catalogQuery)
  if (catalogSnap.empty) {
    await addDoc(catalogRef, {
      funkoId: id || '',
      name,
      title,
      series,
      createdAt: new Date()
    })
  }

  // Write to user's collection with auto-generated key
  // Store name/title/series directly — user doc is source of truth for display
  await addDoc(collection(db, 'users', user.value.uid, 'funkos'), {
    funkoId: id || '',
    name,
    title,
    series,
    quantity: 1,
    addedAt: new Date(),
    image: image || '',
    purchasePrice: purchasePrice || 0,
    stickers: stickers || [],
  })

  await fetchFunkos()
}

async function editFunkoPop({ docId, id, name, title, series, image, purchasePrice, stickers = [] }) {
  if (!user.value) throw new Error('Not authenticated')
  if (!docId) throw new Error('Document ID is required')

  // Update user doc using auto-generated docId
  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', docId)
  await updateDoc(userFunkoRef, {
    name,
    title,
    series,
    image: image || '',
    purchasePrice: purchasePrice || 0,
    stickers: stickers || [],
  })

  // Also update catalog entry if it exists (query by funkoId + name + title)
  const catalogQuery = query(
    collection(db, 'FunkoPops'),
    where('funkoId', '==', id),
    where('name', '==', name),
    where('title', '==', title)
  )
  const catalogSnap = await getDocs(catalogQuery)
  if (!catalogSnap.empty) {
    await updateDoc(catalogSnap.docs[0].ref, { name, title, series })
  }

  await fetchFunkos()
}

async function deleteFunkoPop(docId) {
  if (!user.value) throw new Error('Not authenticated')
  if (!docId) throw new Error('Document ID is required')

  // Delete using auto-generated docId
  await deleteDoc(doc(db, 'users', user.value.uid, 'funkos', docId))
  await fetchFunkos()
}

if (!initialized) {
  initialized = true
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Only fetch if user actually changed
      if (user.value?.uid !== firebaseUser.uid) {
        funkos.value = [] // clear before fetching new user's data
        user.value = firebaseUser
        await fetchFunkos()
      }
    } else {
      // User logged out — clear everything
      user.value = null
      funkos.value = []
      loading.value = false
    }
  })
}

async function incrementFunkoQuantity(docId) {
  if (!user.value) throw new Error('Not authenticated')
  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', docId)
  const snap = await getDoc(userFunkoRef)
  if (!snap.exists()) throw new Error('Funko not found')
  const prevQty = snap.data().quantity || 1
  await updateDoc(userFunkoRef, { quantity: prevQty + 1 })
  await fetchFunkos()
}

function refresh() {
  return fetchFunkos()
}

export function useUserFunkos() {
  return {
    user,
    funkos,
    loading,
    error,
    refresh,
    addFunkoPop,
    editFunkoPop,
    deleteFunkoPop,
    incrementFunkoQuantity,
  }
}
