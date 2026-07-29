import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHARE_OPTIONS,
  applicationAttribution,
  hasShareCardAccess,
  safeCollectorName,
  shareCardFilename,
} from './shareCard.js'

describe('share card access', () => {
  it.each(['active', 'trialing'])('allows %s subscriptions', (subscriptionStatus) => {
    expect(hasShareCardAccess({ subscriptionStatus })).toBe(true)
  })

  it.each(['canceled', 'incomplete_expired', 'past_due', 'unpaid', 'incomplete', undefined])(
    'denies %s subscriptions',
    (subscriptionStatus) => {
      expect(hasShareCardAccess({ subscriptionStatus })).toBe(false)
    },
  )

  it('preserves the documented administrator premium bypass', () => {
    expect(hasShareCardAccess({ isAdmin: true })).toBe(true)
  })
})

describe('share card privacy and output defaults', () => {
  it('hides personal name and recorded value by default', () => {
    expect(DEFAULT_SHARE_OPTIONS.showDisplayName).toBe(false)
    expect(DEFAULT_SHARE_OPTIONS.showRecordedValue).toBe(false)
  })

  it('uses a neutral name and non-private filename', () => {
    expect(safeCollectorName('')).toBe('Funko Collector')
    expect(shareCardFilename()).toBe('funkollection-collection-stats.png')
  })

  it('derives attribution from configured or current origins', () => {
    expect(applicationAttribution('https://www.funkollection.com', 'http://localhost:5173')).toBe(
      'funkollection.com',
    )
    expect(applicationAttribution('', 'http://localhost:5173')).toBe('localhost')
  })
})
