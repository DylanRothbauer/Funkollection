function assignCompetitionRanks(entries) {
  let previousCount = null
  let previousRank = 0

  return entries.map((entry, index) => {
    const popCount = Math.max(0, Number(entry.popCount) || 0)
    const rank = popCount === previousCount ? previousRank : index + 1
    previousCount = popCount
    previousRank = rank
    return { ...entry, popCount, rank }
  })
}

function createPublicEntry(data, rank, isCurrentUser = false) {
  return {
    rank,
    displayName:
      typeof data?.displayName === 'string' && data.displayName.trim()
        ? data.displayName.trim()
        : 'Funko Collector',
    photoURL: typeof data?.photoURL === 'string' ? data.photoURL : '',
    popCount: Math.max(0, Number(data?.popCount) || 0),
    isCurrentUser: Boolean(isCurrentUser),
  }
}

module.exports = { assignCompetitionRanks, createPublicEntry }
