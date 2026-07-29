const test = require('node:test')
const assert = require('node:assert/strict')
const { assignCompetitionRanks, createPublicEntry } = require('./leaderboardLogic')

test('assigns competition ranks consistently across ties', () => {
  const ranked = assignCompetitionRanks([
    { name: 'A', popCount: 100 },
    { name: 'B', popCount: 80 },
    { name: 'C', popCount: 80 },
    { name: 'D', popCount: 70 },
  ])
  assert.deepEqual(
    ranked.map(({ rank }) => rank),
    [1, 2, 2, 4],
  )
})

test('public entries exclude private and internal fields', () => {
  const entry = createPublicEntry(
    {
      displayName: '',
      photoURL: 10,
      popCount: '14',
      email: 'private@example.com',
      purchasePrice: 300,
      uid: 'private',
    },
    3,
    true,
  )
  assert.deepEqual(entry, {
    rank: 3,
    displayName: 'Funko Collector',
    photoURL: '',
    popCount: 14,
    isCurrentUser: true,
  })
})
