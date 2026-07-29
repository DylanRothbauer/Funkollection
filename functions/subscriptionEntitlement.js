const ACCESS_STATUSES = new Set(['active', 'trialing'])

function timestampMillis(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  if (typeof value._seconds === 'number') return value._seconds * 1000
  if (value instanceof Date) return value.getTime()
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function subscriptionPriceIds(subscription = {}) {
  const ids = new Set()
  const addPrice = (price) => {
    if (typeof price === 'string') ids.add(price)
    if (price && typeof price.id === 'string') ids.add(price.id)
  }

  addPrice(subscription.price)
  for (const item of subscription.items || []) addPrice(item?.price)
  for (const price of subscription.prices || []) addPrice(price)
  return ids
}

function evaluateSubscription(subscription, options = {}) {
  const nowMs = options.nowMs ?? Date.now()
  const expectedPriceId = options.expectedPriceId
  const status = typeof subscription?.status === 'string' ? subscription.status : 'missing'
  const currentPeriodEndMs = timestampMillis(
    status === 'trialing'
      ? subscription?.trial_end || subscription?.current_period_end
      : subscription?.current_period_end,
  )
  const priceMatches = !expectedPriceId || subscriptionPriceIds(subscription).has(expectedPriceId)
  const hasPremiumAccess =
    ACCESS_STATUSES.has(status) &&
    priceMatches &&
    currentPeriodEndMs !== null &&
    currentPeriodEndMs > nowMs

  return {
    status,
    hasPremiumAccess,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    currentPeriodEndMs,
    priceMatches,
  }
}

function selectEntitledSubscription(subscriptions, options = {}) {
  return (
    (subscriptions || []).find(
      (subscription) => evaluateSubscription(subscription, options).hasPremiumAccess,
    ) || null
  )
}

module.exports = {
  evaluateSubscription,
  selectEntitledSubscription,
  subscriptionPriceIds,
  timestampMillis,
}
