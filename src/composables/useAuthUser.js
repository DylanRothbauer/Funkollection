import { ref, onUnmounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Singleton refs and unsubscribe
const user = ref(null)
const loading = ref(true)
let unsubscribe = null
let listenerSetup = false

export function useAuthUser() {
  if (!listenerSetup) {
    const auth = getAuth()
    unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
    })
    listenerSetup = true
    console.log('Auth listener set up')
  }

  onUnmounted(() => {
    // Do not unsubscribe globally, keep listener for app lifetime
  })

  return { user, loading }
}
