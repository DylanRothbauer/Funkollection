export function subscriptionTimestampMillis(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  if (typeof value._seconds === 'number') return value._seconds * 1000
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

export function subscriptionGrantsPremium(subscription, nowMs = Date.now()) {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) return false
  const accessEnd = subscriptionTimestampMillis(
    subscription.status === 'trialing'
      ? subscription.trial_end || subscription.current_period_end
      : subscription.current_period_end,
  )
  return accessEnd !== null && accessEnd > nowMs
}

export function anySubscriptionGrantsPremium(subscriptions, nowMs = Date.now()) {
  return (subscriptions || []).some((subscription) =>
    subscriptionGrantsPremium(subscription, nowMs),
  )
}
