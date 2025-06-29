import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const user = ref(null)
const funkos = ref([])
const loading = ref(true)
const error = ref(null)
let initialized = false

export function useUserFunkos() {
  if (!initialized) {
    initialized = true
    loading.value = true
    const auth = getAuth()
    onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        try {
          const snapshot = await getDocs(collection(db, 'users', firebaseUser.uid, 'funkos'))
          funkos.value = snapshot.docs.map((doc) => doc.data())
        } catch (e) {
          error.value = e
        }
      }
      loading.value = false
    })
  }
  const refresh = async () => {
    loading.value = true
    error.value = null
    const auth = getAuth()
    if (user.value) {
      try {
        const snapshot = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
        funkos.value = snapshot.docs.map((doc) => doc.data())
      } catch (e) {
        error.value = e
      }
    }
    loading.value = false
  }
  return { user, funkos, loading, error, refresh }
}
