const test = require('node:test')
const assert = require('node:assert/strict')
const { evaluateSubscription, selectEntitledSubscription } = require('./subscriptionEntitlement')

const nowMs = Date.UTC(2026, 6, 29)
const future = { seconds: Math.floor((nowMs + 86400000) / 1000) }
const past = { seconds: Math.floor((nowMs - 86400000) / 1000) }
const premiumPrice = 'price_premium'

function subscription(status, overrides = {}) {
  return {
    status,
    current_period_end: future,
    items: [{ price: { id: premiumPrice } }],
    ...overrides,
  }
}

test('active and trialing subscriptions grant access through their valid period', () => {
  assert.equal(
    evaluateSubscription(subscription('active'), { nowMs, expectedPriceId: premiumPrice })
      .hasPremiumAccess,
    true,
  )
  assert.equal(
    evaluateSubscription(subscription('trialing', { trial_end: future }), {
      nowMs,
      expectedPriceId: premiumPrice,
    }).hasPremiumAccess,
    true,
  )
})

test('scheduled cancellation retains access until the period ends', () => {
  const canceling = subscription('active', { cancel_at_period_end: true })
  const result = evaluateSubscription(canceling, { nowMs, expectedPriceId: premiumPrice })
  assert.equal(result.hasPremiumAccess, true)
  assert.equal(result.cancelAtPeriodEnd, true)
})

test('expired periods, missing dates, and the wrong price fail closed', () => {
  assert.equal(
    evaluateSubscription(subscription('active', { current_period_end: past }), {
      nowMs,
      expectedPriceId: premiumPrice,
    }).hasPremiumAccess,
    false,
  )
  assert.equal(
    evaluateSubscription(subscription('active', { current_period_end: null }), {
      nowMs,
      expectedPriceId: premiumPrice,
    }).hasPremiumAccess,
    false,
  )
  assert.equal(
    evaluateSubscription(subscription('active'), {
      nowMs,
      expectedPriceId: 'price_other',
    }).hasPremiumAccess,
    false,
  )
})

test('non-entitled and unknown statuses do not grant access', () => {
  for (const status of [
    'past_due',
    'incomplete',
    'incomplete_expired',
    'canceled',
    'unpaid',
    'paused',
    'unknown',
  ]) {
    assert.equal(
      evaluateSubscription(subscription(status), { nowMs, expectedPriceId: premiumPrice })
        .hasPremiumAccess,
      false,
    )
  }
})

test('selects an entitled subscription from mixed historical records', () => {
  const selected = selectEntitledSubscription([subscription('canceled'), subscription('active')], {
    nowMs,
    expectedPriceId: premiumPrice,
  })
  assert.equal(selected.status, 'active')
})
