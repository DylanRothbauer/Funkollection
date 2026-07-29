const STATUS_PRIORITY = {
  trialing: 0,
  active: 1,
  past_due: 2,
  unpaid: 3,
  incomplete: 4,
  paused: 5,
  canceled: 6,
  incomplete_expired: 7,
}

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatSubscriptionDate(value) {
  const date = toDate(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function billingInterval(subscription) {
  const recurring =
    subscription?.items?.[0]?.price?.recurring ||
    subscription?.price?.recurring ||
    subscription?.prices?.[0]?.recurring
  const interval = recurring?.interval
  const count = recurring?.interval_count || 1

  if (!interval) return ''
  if (count === 1)
    return interval === 'year' ? 'Yearly' : interval === 'month' ? 'Monthly' : interval
  return `Every ${count} ${interval}s`
}

function planName(subscription) {
  return (
    subscription?.product?.name ||
    subscription?.items?.[0]?.price?.product?.name ||
    subscription?.price?.product?.name ||
    'Premium'
  )
}

export function selectPrimarySubscription(subscriptions) {
  return [...subscriptions].sort((first, second) => {
    const statusDifference =
      (STATUS_PRIORITY[first.status] ?? 99) - (STATUS_PRIORITY[second.status] ?? 99)
    if (statusDifference) return statusDifference

    return (
      (toDate(second.current_period_end)?.getTime() || 0) -
      (toDate(first.current_period_end)?.getTime() || 0)
    )
  })[0]
}

export function presentSubscription(subscription) {
  if (!subscription) {
    return {
      plan: 'Free',
      label: 'Free',
      tone: 'neutral',
      message: 'You are currently using the free plan.',
      interval: '',
      details: [],
      canManage: false,
      canUpgrade: true,
    }
  }

  const status = subscription.status
  const periodEnd = formatSubscriptionDate(subscription.current_period_end)
  const trialEnd = formatSubscriptionDate(subscription.trial_end)
  const canceledAt = formatSubscriptionDate(subscription.canceled_at)
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)
  const details = []
  const interval = billingInterval(subscription)

  if (interval) details.push({ label: 'Billing cycle', value: interval })
  if (formatSubscriptionDate(subscription.current_period_start)) {
    details.push({
      label: 'Current period started',
      value: formatSubscriptionDate(subscription.current_period_start),
    })
  }

  if (status === 'trialing') {
    if (trialEnd) details.push({ label: 'Trial ends', value: trialEnd })
    return {
      plan: planName(subscription),
      label: cancelAtPeriodEnd ? 'Canceling' : 'Trialing',
      tone: cancelAtPeriodEnd ? 'warning' : 'positive',
      message: cancelAtPeriodEnd
        ? `Your trial will end${trialEnd ? ` on ${trialEnd}` : ''} and will not renew.`
        : `Your premium trial is active${trialEnd ? ` until ${trialEnd}` : ''}.`,
      interval,
      details,
      canManage: true,
      canUpgrade: false,
    }
  }

  if (status === 'active') {
    if (periodEnd) {
      details.push({
        label: cancelAtPeriodEnd ? 'Access through' : 'Next renewal',
        value: periodEnd,
      })
    }
    return {
      plan: planName(subscription),
      label: cancelAtPeriodEnd ? 'Canceling' : 'Active',
      tone: cancelAtPeriodEnd ? 'warning' : 'positive',
      message: cancelAtPeriodEnd
        ? `Your plan remains active${periodEnd ? ` until ${periodEnd}` : ''} and will not renew.`
        : `Your premium plan is active${periodEnd ? ` and renews on ${periodEnd}` : ''}.`,
      interval,
      details,
      canManage: true,
      canUpgrade: false,
    }
  }

  if (status === 'past_due' || status === 'unpaid') {
    if (periodEnd) details.push({ label: 'Current period ends', value: periodEnd })
    return {
      plan: planName(subscription),
      label: status === 'past_due' ? 'Payment required' : 'Payment overdue',
      tone: 'danger',
      message:
        'Your latest payment could not be completed. Manage billing to review your payment method.',
      interval,
      details,
      canManage: true,
      canUpgrade: false,
    }
  }

  if (status === 'incomplete') {
    return {
      plan: planName(subscription),
      label: 'Setup incomplete',
      tone: 'warning',
      message: 'Your premium subscription setup has not been completed.',
      interval,
      details,
      canManage: true,
      canUpgrade: false,
    }
  }

  if (status === 'paused') {
    return {
      plan: planName(subscription),
      label: 'Paused',
      tone: 'warning',
      message: 'Your premium subscription is currently paused.',
      interval,
      details,
      canManage: true,
      canUpgrade: false,
    }
  }

  if (status === 'canceled' || status === 'incomplete_expired') {
    if (canceledAt) details.push({ label: 'Canceled', value: canceledAt })
    if (periodEnd) details.push({ label: 'Access ended', value: periodEnd })

    return {
      plan: 'Free',
      label: status === 'incomplete_expired' ? 'Expired' : 'Canceled',
      tone: 'neutral',
      message:
        status === 'incomplete_expired'
          ? 'Your previous subscription setup expired. You are currently using the free plan.'
          : 'Your previous premium subscription is no longer active. You are currently using the free plan.',
      interval,
      details,
      canManage: true,
      canUpgrade: true,
    }
  }

  return {
    plan: planName(subscription),
    label: 'Temporarily unavailable',
    tone: 'neutral',
    message:
      'We cannot confirm this subscription state right now. Manage billing for the latest details.',
    interval,
    details,
    canManage: true,
    canUpgrade: false,
  }
}
