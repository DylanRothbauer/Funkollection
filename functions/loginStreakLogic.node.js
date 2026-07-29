const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateStreakTransition, utcDateKey } = require('./loginStreakLogic')

test('first login initializes current and highest streaks', () => {
  assert.deepEqual(calculateStreakTransition({}, '2026-07-29'), {
    currentStreak: 1,
    highestStreak: 1,
    lastCreditedDate: '2026-07-29',
    streakStartedDate: '2026-07-29',
    creditedToday: true,
    wasReset: false,
    isNewHighest: true,
  })
})

test('same-day retries are idempotent', () => {
  const first = calculateStreakTransition({}, '2026-07-29')
  const retry = calculateStreakTransition(first, '2026-07-29')
  assert.equal(retry.currentStreak, 1)
  assert.equal(retry.highestStreak, 1)
  assert.equal(retry.creditedToday, false)
})

test('next-day login increments and can set a personal best', () => {
  const result = calculateStreakTransition(
    {
      currentStreak: 6,
      highestStreak: 6,
      lastCreditedDate: '2026-07-29',
      streakStartedDate: '2026-07-24',
    },
    '2026-07-30',
  )
  assert.equal(result.currentStreak, 7)
  assert.equal(result.highestStreak, 7)
  assert.equal(result.isNewHighest, true)
  assert.equal(result.streakStartedDate, '2026-07-24')
})

test('a missed day starts at one and preserves the highest streak', () => {
  const result = calculateStreakTransition(
    {
      currentStreak: 8,
      highestStreak: 12,
      lastCreditedDate: '2026-07-27',
      streakStartedDate: '2026-07-20',
    },
    '2026-07-29',
  )
  assert.equal(result.currentStreak, 1)
  assert.equal(result.highestStreak, 12)
  assert.equal(result.wasReset, true)
  assert.equal(result.isNewHighest, false)
})

test('month, year, and leap-day boundaries remain consecutive', () => {
  for (const [lastCreditedDate, today] of [
    ['2026-01-31', '2026-02-01'],
    ['2025-12-31', '2026-01-01'],
    ['2028-02-28', '2028-02-29'],
    ['2028-02-29', '2028-03-01'],
  ]) {
    const result = calculateStreakTransition(
      { currentStreak: 2, highestStreak: 5, lastCreditedDate },
      today,
    )
    assert.equal(result.currentStreak, 3)
    assert.equal(result.highestStreak, 5)
  }
})

test('malformed, missing, and future records restart safely', () => {
  for (const record of [
    { currentStreak: -4, highestStreak: '10', lastCreditedDate: 'invalid' },
    { currentStreak: 4, highestStreak: 9, lastCreditedDate: '2099-01-01' },
    { currentStreak: Number.NaN, highestStreak: null },
  ]) {
    const result = calculateStreakTransition(record, '2026-07-29')
    assert.equal(result.currentStreak, 1)
    assert.ok(result.highestStreak >= 1)
  }
})

test('trusted dates are normalized to UTC keys', () => {
  assert.equal(utcDateKey(new Date('2026-07-30T00:15:00Z')), '2026-07-30')
  assert.equal(utcDateKey(new Date('2026-07-29T23:59:59Z')), '2026-07-29')
})
