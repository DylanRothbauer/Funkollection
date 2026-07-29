const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function utcDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new TypeError('A valid date is required.')
  return date.toISOString().slice(0, 10)
}

function dateKeyDayNumber(value) {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return Math.floor(timestamp / 86400000)
}

function safeStreak(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

function calculateStreakTransition(record = {}, todayKey) {
  const todayDay = dateKeyDayNumber(todayKey)
  if (todayDay === null) throw new TypeError('A valid UTC date key is required.')

  const previousCurrent = safeStreak(record.currentStreak)
  const previousHighest = Math.max(previousCurrent, safeStreak(record.highestStreak))
  const lastDay = dateKeyDayNumber(record.lastCreditedDate)

  if (lastDay === todayDay) {
    const normalizedCurrent = Math.max(1, previousCurrent)
    return {
      currentStreak: normalizedCurrent,
      highestStreak: Math.max(previousHighest, normalizedCurrent),
      lastCreditedDate: todayKey,
      streakStartedDate:
        dateKeyDayNumber(record.streakStartedDate) === null ? todayKey : record.streakStartedDate,
      creditedToday: false,
      wasReset: false,
      isNewHighest: false,
    }
  }

  const isConsecutive = lastDay !== null && todayDay - lastDay === 1
  const nextCurrent = isConsecutive ? Math.max(1, previousCurrent) + 1 : 1
  const nextHighest = Math.max(previousHighest, nextCurrent)

  return {
    currentStreak: nextCurrent,
    highestStreak: nextHighest,
    lastCreditedDate: todayKey,
    streakStartedDate:
      isConsecutive && dateKeyDayNumber(record.streakStartedDate) !== null
        ? record.streakStartedDate
        : todayKey,
    creditedToday: true,
    wasReset: lastDay !== null && todayDay - lastDay > 1,
    isNewHighest: nextCurrent > previousHighest,
  }
}

module.exports = {
  calculateStreakTransition,
  dateKeyDayNumber,
  utcDateKey,
}
