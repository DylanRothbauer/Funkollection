import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase.js'

const functions = getFunctions(app, 'us-central1')

export async function getCollectionLeaderboard() {
  const callable = httpsCallable(functions, 'getCollectionLeaderboard')
  const response = await callable()
  return response.data
}

export async function setLeaderboardParticipation(enabled) {
  const callable = httpsCallable(functions, 'setLeaderboardParticipation')
  const response = await callable({ enabled })
  return response.data
}
