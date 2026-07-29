import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase.js'

export async function recordDailyLogin() {
  const functions = getFunctions(app, 'us-central1')
  const callable = httpsCallable(functions, 'recordDailyLogin')
  const response = await callable()
  return response.data
}
