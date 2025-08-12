import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const user = ref(null)
const funkos = ref([])
const loading = ref(true)
const error = ref(null)
let initialized = false

async function fetchUserFunkos() {
  if (!user.value) return []
  const snapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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

    // Build a map of global funkos for quick lookup by id
    const globalMap = new Map(globalFunkos.map((g) => [g.id, g]))

    // Merge user funkos with global data
    funkos.value = userFunkos.map((u) => {
      const global = globalMap.get(u.id) || {}
      return {
        ...global, // global metadata (series, title, name, etc)
        ...u, // user data (quantity, addedAt, purchasePrice, image, etc)
      }
    })
  } catch (e) {
    error.value = e
  }
  loading.value = false
}

// The rest of your add, edit, delete functions remain unchanged
// But remember to import getDoc (it's missing in your original code, needed for addFunkoPop)

async function addFunkoPop({ id, name, title, series, image, purchasePrice }) {
  if (!user.value) throw new Error('Not authenticated')

  const funkoDocRef = doc(db, 'FunkoPops', id)
  const funkoDocSnap = await getDoc(funkoDocRef)
  if (!funkoDocSnap.exists()) {
    await setDoc(funkoDocRef, { name, title, series, id, createdAt: new Date() })
  }

  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', id)
  const userFunkoSnap = await getDoc(userFunkoRef)
  if (userFunkoSnap.exists()) {
    const prevQty = userFunkoSnap.data().quantity || 1
    await updateDoc(userFunkoRef, {
      quantity: prevQty + 1,
      lastAddedAt: new Date(),
      image: image || '',
      purchasePrice: purchasePrice || 0,
    })
  } else {
    await setDoc(userFunkoRef, {
      quantity: 1,
      addedAt: new Date(),
      image: image || '',
      purchasePrice: purchasePrice || 0,
    })
  }

  await fetchFunkos()
}

async function editFunkoPop({ id, name, title, series, image, purchasePrice }) {
  if (!user.value) throw new Error('Not authenticated')
  if (!id) throw new Error('Funko ID is required')

  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', id)
  await updateDoc(userFunkoRef, {
    name,
    title,
    series,
    image: image || '',
    purchasePrice: purchasePrice || 0,
  })

  const funkoDocRef = doc(db, 'FunkoPops', id)
  await updateDoc(funkoDocRef, {
    name,
    title,
    series,
  })

  await fetchFunkos()
}

async function deleteFunkoPop(id) {
  if (!user.value) throw new Error('Not authenticated')
  if (!id) throw new Error('Funko ID is required')

  const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', id)
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
