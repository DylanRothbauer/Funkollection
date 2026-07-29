import { describe, expect, it } from 'vitest'
import {
  anySubscriptionGrantsPremium,
  subscriptionGrantsPremium,
} from './subscriptionEntitlement.js'

const nowMs = Date.UTC(2026, 6, 29)
const future = { seconds: Math.floor((nowMs + 86400000) / 1000) }
const past = { seconds: Math.floor((nowMs - 86400000) / 1000) }

describe('subscription entitlement', () => {
  it.each(['active', 'trialing'])('grants access for current %s subscriptions', (status) => {
    expect(
      subscriptionGrantsPremium(
        {
          status,
          current_period_end: future,
          trial_end: status === 'trialing' ? future : null,
        },
        nowMs,
      ),
    ).toBe(true)
  })

  it('keeps access during a scheduled cancellation', () => {
    expect(
      subscriptionGrantsPremium(
        { status: 'active', current_period_end: future, cancel_at_period_end: true },
        nowMs,
      ),
    ).toBe(true)
  })

  it.each(['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'canceled', 'paused'])(
    'denies %s subscriptions',
    (status) => {
      expect(subscriptionGrantsPremium({ status, current_period_end: future }, nowMs)).toBe(false)
    },
  )

  it('fails closed for expired or incomplete subscription projections', () => {
    expect(subscriptionGrantsPremium({ status: 'active', current_period_end: past }, nowMs)).toBe(
      false,
    )
    expect(subscriptionGrantsPremium({ status: 'active' }, nowMs)).toBe(false)
  })

  it('finds access among historical records', () => {
    expect(
      anySubscriptionGrantsPremium(
        [
          { status: 'canceled', current_period_end: past },
          { status: 'active', current_period_end: future },
        ],
        nowMs,
      ),
    ).toBe(true)
  })
})
