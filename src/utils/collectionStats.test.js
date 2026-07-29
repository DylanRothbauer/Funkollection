import { describe, expect, it } from 'vitest'
import { calculateCollectionStats, formatRecordedValue } from './collectionStats.js'

describe('calculateCollectionStats', () => {
  it('normalizes quantities, prices, series, favorites, and badges', () => {
    const stats = calculateCollectionStats(
      [
        { quantity: 2, purchasePrice: '12.50', series: 'Heroes' },
        { quantity: 1, purchasePrice: 10, series: 'Heroes' },
        { quantity: 'invalid', purchasePrice: 'not-a-price', series: 'Animation' },
      ],
      { favoriteCount: 2, earnedBadgeCount: 4 },
    )
    expect(stats).toEqual({
      totalPops: 4,
      totalEntries: 3,
      favoriteCount: 2,
      earnedBadgeCount: 4,
      seriesCount: 2,
      topSeries: 'Heroes',
      recordedValue: 35,
    })
    expect(formatRecordedValue(stats.recordedValue)).toBe('$35')
  })

  it('returns a usable empty state', () => {
    expect(calculateCollectionStats()).toEqual({
      totalPops: 0,
      totalEntries: 0,
      favoriteCount: 0,
      earnedBadgeCount: 0,
      seriesCount: 0,
      topSeries: '',
      recordedValue: 0,
    })
  })
})
