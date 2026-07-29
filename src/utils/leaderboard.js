export function formatPopCount(count) {
  const value = Math.max(0, Number(count) || 0)
  return `${value.toLocaleString()} ${value === 1 ? 'Pop' : 'Pops'}`
}

export function collectorInitial(displayName) {
  const name = typeof displayName === 'string' ? displayName.trim() : ''
  return name.charAt(0).toUpperCase() || 'F'
}

export function rankLabel(rank) {
  return Number.isFinite(Number(rank)) && Number(rank) > 0 ? `#${Number(rank)}` : 'Unranked'
}

export function normalizeLeaderboardResponse(data) {
  return {
    entries: Array.isArray(data?.entries)
      ? data.entries.map((entry) => ({
          rank: Math.max(1, Number(entry.rank) || 1),
          displayName:
            typeof entry.displayName === 'string' && entry.displayName.trim()
              ? entry.displayName.trim()
              : 'Funko Collector',
          photoURL: typeof entry.photoURL === 'string' ? entry.photoURL : '',
          popCount: Math.max(0, Number(entry.popCount) || 0),
          isCurrentUser: Boolean(entry.isCurrentUser),
        }))
      : [],
    currentUser: data?.currentUser
      ? {
          rank: Math.max(1, Number(data.currentUser.rank) || 1),
          displayName:
            typeof data.currentUser.displayName === 'string' && data.currentUser.displayName.trim()
              ? data.currentUser.displayName.trim()
              : 'Funko Collector',
          photoURL: typeof data.currentUser.photoURL === 'string' ? data.currentUser.photoURL : '',
          popCount: Math.max(0, Number(data.currentUser.popCount) || 0),
          isCurrentUser: true,
          popsToNextRank: Math.max(0, Number(data.currentUser.popsToNextRank) || 0),
          popsToTopTen: Math.max(0, Number(data.currentUser.popsToTopTen) || 0),
        }
      : null,
    participating: Boolean(data?.participating),
    totalCollectors: Math.max(0, Number(data?.totalCollectors) || 0),
  }
}
