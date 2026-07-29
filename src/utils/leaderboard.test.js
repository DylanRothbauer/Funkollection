import { describe, expect, it } from 'vitest'
import {
  collectorInitial,
  formatPopCount,
  normalizeLeaderboardResponse,
  rankLabel,
} from './leaderboard.js'

describe('leaderboard presentation', () => {
  it('formats singular, plural, and rank labels', () => {
    expect(formatPopCount(1)).toBe('1 Pop')
    expect(formatPopCount(1200)).toBe('1,200 Pops')
    expect(rankLabel(10)).toBe('#10')
    expect(rankLabel()).toBe('Unranked')
  })

  it('uses a safe collector fallback', () => {
    expect(collectorInitial('')).toBe('F')
    expect(collectorInitial('  Dana  ')).toBe('D')
  })

  it('normalizes safe fields without carrying private data', () => {
    const normalized = normalizeLeaderboardResponse({
      entries: [
        {
          rank: 1,
          displayName: '',
          photoURL: 42,
          popCount: '12',
          email: 'private@example.com',
          uid: 'private',
        },
      ],
      currentUser: { rank: 20, popCount: 3, popsToNextRank: 2 },
      participating: true,
      totalCollectors: 24,
    })

    expect(normalized.entries[0]).toEqual({
      rank: 1,
      displayName: 'Funko Collector',
      photoURL: '',
      popCount: 12,
      isCurrentUser: false,
    })
    expect(normalized.entries[0]).not.toHaveProperty('email')
    expect(normalized.entries[0]).not.toHaveProperty('uid')
    expect(normalized.currentUser.rank).toBe(20)
  })

  it('supports fewer than ten entries and an unranked user', () => {
    expect(normalizeLeaderboardResponse({ entries: [], currentUser: null })).toEqual({
      entries: [],
      currentUser: null,
      participating: false,
      totalCollectors: 0,
    })
  })
})
