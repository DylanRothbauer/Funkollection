import type { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { addDoc, collection, getFirestore, onSnapshot } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

export const getCheckoutUrl = async (app: FirebaseApp, priceId: string): Promise<string> => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User is not authenticated')

  const db = getFirestore(app)
  const checkoutSessionRef = collection(db, 'customers', userId, 'checkout_sessions')

  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: window.location.origin + '/dashboard',
    cancel_url: window.location.origin + '/dashboard',
  })

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        error?: { message: string }
        url?: string
      }
      if (error) {
        unsubscribe()
        reject(new Error(`An error occurred: ${error.message}`))
      }
      if (url) {
        unsubscribe()
        resolve(url)
      }
    })
  })
}

export const getPortalUrl = async (app: FirebaseApp): Promise<string> => {
  const auth = getAuth(app)
  const user = auth.currentUser
  if (!user) throw new Error('User is not authenticated')

  const functions = getFunctions(app, 'us-central1')
  const functionRef = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink')
  const { data } = await functionRef({
    returnUrl: window.location.origin + '/account',
  })
  const { url } = data as { url?: string }

  if (!url) throw new Error('No billing portal URL returned')

  const trustedUrl = new URL(url)
  if (trustedUrl.protocol !== 'https:' || trustedUrl.hostname !== 'billing.stripe.com') {
    throw new Error('Invalid billing portal URL')
  }

  return trustedUrl.toString()
}
