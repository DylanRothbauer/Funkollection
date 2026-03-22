import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const user = ref(null)
const funkos = ref([])
const loading = ref(true)
const error = ref(null)
let initialized = false

async function fetchUserFunkos() {
  if (!user.value) return []
  const snapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
  // docId is now the auto-generated key, funkoId is the actual Funko Pop number
  return snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }))
}

async function fetchGlobalFunkos() {
  const snapshot = await getDocs(collection(db, 'FunkoPops'))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
    const [userFunkos, globalFunkos] = await Promise.all([fetchUserFunkos(), fetchGlobalFunkos()])

    // Build a map of global funkos for quick lookup by funkoId
    const globalMap = new Map(globalFunkos.map((g) => [g.id, g]))

    // Merge user funkos with global data
    // u.funkoId is the Funko Pop number, docId is the Firestore document key
    funkos.value = userFunkos.map((u) => {
      const global = globalMap.get(u.funkoId) || {}
      return {
        ...global,
        ...u,
        id: u.funkoId, // keep id as the funko number for display/editing
      }
    })
  } catch (e) {
    error.value = e
  }
  loading.value = false
}

async function addFunkoPop({ id, name, title, series, image, purchasePrice, stickers = [] }) {
  if (!user.value) throw new Error('Not authenticated')

  // Save to global FunkoPops catalog if not already there
  const funkoDocRef = doc(db, 'FunkoPops', id)
  const funkoDocSnap = await getDoc(funkoDocRef)
  if (!funkoDocSnap.exists()) {
    await setDoc(funkoDocRef, { name, title, series, id, createdAt: new Date() })
  }

  // Always use addDoc to generate a unique key — allows duplicate funko IDs
  await addDoc(collection(db, 'users', user.value.uid, 'funkos'), {
    funkoId: id,        // store the funko number as a field, not the key
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

  // Update user's funko using the auto-generated docId
  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', docId)
  await updateDoc(userFunkoRef, {
    image: image || '',
    purchasePrice: purchasePrice || 0,
    stickers: stickers || [],
  })

  // Update global catalog
  const funkoDocRef = doc(db, 'FunkoPops', id)
  await updateDoc(funkoDocRef, { name, title, series })

  await fetchFunkos()
}

async function deleteFunkoPop(docId) {
  if (!user.value) throw new Error('Not authenticated')
  if (!docId) throw new Error('Document ID is required')

  // Delete using the auto-generated docId, not the funko number
  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', docId)
  await deleteDoc(userFunkoRef)
  await fetchFunkos()
}

if (!initialized) {
  initialized = true
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) {
      await fetchFunkos()
    } else {
      funkos.value = []
    }
  })
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
  }
}
