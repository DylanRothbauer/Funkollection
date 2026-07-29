import { computed, ref } from 'vue'
import { recordDailyLogin } from '../services/loginStreakService.js'

const streak = ref(null)
const loading = ref(false)
const error = ref('')
const announcement = ref('')
const newlyCredited = ref(false)
const evaluatedUserId = ref('')
let requestPromise = null

export function useLoginStreak() {
  const currentStreak = computed(() => streak.value?.currentStreak || 0)
  const highestStreak = computed(() => streak.value?.highestStreak || 0)
  const hasStarted = computed(() => highestStreak.value > 0)
  const creditedToday = computed(() => Boolean(streak.value?.lastCreditedDate))

  async function evaluateForUser(userId, { force = false } = {}) {
    if (!userId) return null
    if (!force && evaluatedUserId.value === userId && streak.value) return streak.value
    if (requestPromise) return requestPromise

    loading.value = true
    error.value = ''
    newlyCredited.value = false

    requestPromise = recordDailyLogin()
      .then((result) => {
        streak.value = result
        evaluatedUserId.value = userId
        newlyCredited.value = Boolean(result.creditedToday)

        if (result.creditedToday) {
          if (result.isNewHighest) {
            announcement.value = `New personal best: ${result.currentStreak} ${result.currentStreak === 1 ? 'day' : 'days'}.`
          } else if (result.wasReset) {
            announcement.value = 'Welcome back—a new daily streak has started.'
          } else {
            announcement.value = `Daily streak extended to ${result.currentStreak} ${result.currentStreak === 1 ? 'day' : 'days'}.`
          }
        }
        return result
      })
      .catch(() => {
        error.value = 'Daily streak is temporarily unavailable.'
        return null
      })
      .finally(() => {
        loading.value = false
        requestPromise = null
      })

    return requestPromise
  }

  function evaluateIfDayMayHaveChanged(userId) {
    const localUtcKey = new Date().toISOString().slice(0, 10)
    if (streak.value?.lastCreditedDate === localUtcKey) return Promise.resolve(streak.value)
    return evaluateForUser(userId, { force: true })
  }

  function resetForSignOut() {
    streak.value = null
    error.value = ''
    announcement.value = ''
    newlyCredited.value = false
    evaluatedUserId.value = ''
    requestPromise = null
  }

  return {
    streak,
    loading,
    error,
    announcement,
    newlyCredited,
    currentStreak,
    highestStreak,
    hasStarted,
    creditedToday,
    evaluateForUser,
    evaluateIfDayMayHaveChanged,
    resetForSignOut,
  }
}
