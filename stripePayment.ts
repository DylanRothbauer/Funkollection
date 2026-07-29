import type { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { doc, getFirestore, onSnapshot } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const CHECKOUT_TIMEOUT_MS = 30000

function assertStripeUrl(value: string, expectedHostname: string): string {
  const trustedUrl = new URL(value)
  if (trustedUrl.protocol !== 'https:' || trustedUrl.hostname !== expectedHostname) {
    throw new Error('Stripe returned an invalid redirect URL')
  }
  return trustedUrl.toString()
}

export const getCheckoutUrl = async (app: FirebaseApp): Promise<string> => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User is not authenticated')

  const functions = getFunctions(app, 'us-central1')
  const createCheckout = httpsCallable(functions, 'createPremiumCheckout')
  const { data } = await createCheckout()
  const { sessionId } = data as { sessionId?: string }
  if (!sessionId) throw new Error('Checkout session was not created')

  const db = getFirestore(app)
  const checkoutSessionRef = doc(db, 'customers', userId, 'checkout_sessions', sessionId)

  return new Promise<string>((resolve, reject) => {
    let unsubscribe = () => {}
    const timeout = window.setTimeout(() => {
      unsubscribe()
      reject(new Error('Checkout creation timed out'))
    }, CHECKOUT_TIMEOUT_MS)

    unsubscribe = onSnapshot(
      checkoutSessionRef,
      (snapshot) => {
        const { error, url } = snapshot.data() as {
          error?: { message?: string }
          url?: string
        }
        if (error) {
          window.clearTimeout(timeout)
          unsubscribe()
          reject(new Error('Stripe could not create the Checkout session'))
        }
        if (url) {
          window.clearTimeout(timeout)
          unsubscribe()
          try {
            resolve(assertStripeUrl(url, 'checkout.stripe.com'))
          } catch (error) {
            reject(error)
          }
        }
      },
      () => {
        window.clearTimeout(timeout)
        unsubscribe()
        reject(new Error('Checkout status could not be loaded'))
      },
    )
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

  return assertStripeUrl(url, 'billing.stripe.com')
}
