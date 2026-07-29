function safeQuantity(value) {
  const quantity = Number(value)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

function safePrice(value) {
  const price = Number.parseFloat(value)
  return Number.isFinite(price) && price > 0 ? price : 0
}

export function calculateCollectionStats(
  funkos = [],
  { favoriteCount = 0, earnedBadgeCount = 0 } = {},
) {
  const seriesTotals = new Map()
  let totalPops = 0
  let recordedValue = 0

  for (const funko of funkos) {
    const quantity = safeQuantity(funko.quantity)
    const series = typeof funko.series === 'string' ? funko.series.trim() : ''
    totalPops += quantity
    recordedValue += safePrice(funko.purchasePrice) * quantity
    if (series) seriesTotals.set(series, (seriesTotals.get(series) || 0) + quantity)
  }

  const topSeries =
    [...seriesTotals.entries()].sort(
      ([firstName, firstCount], [secondName, secondCount]) =>
        secondCount - firstCount || firstName.localeCompare(secondName),
    )[0]?.[0] || ''

  return {
    totalPops,
    totalEntries: funkos.length,
    favoriteCount: Math.max(0, Number(favoriteCount) || 0),
    earnedBadgeCount: Math.max(0, Number(earnedBadgeCount) || 0),
    seriesCount: seriesTotals.size,
    topSeries,
    recordedValue,
  }
}

export function formatRecordedValue(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}
