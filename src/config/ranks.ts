export const RANK_TIERS = [
  { name: 'Iron', minElo: 0, color: 'text-gray-400', border: 'border-gray-500', shadow: 'shadow-gray-500/50' },
  { name: 'Bronze', minElo: 1000, color: 'text-amber-700', border: 'border-amber-700', shadow: 'shadow-amber-700/50' },
  { name: 'Silver', minElo: 1500, color: 'text-gray-300', border: 'border-gray-300', shadow: 'shadow-gray-300/50' },
  { name: 'Gold', minElo: 2000, color: 'text-yellow-400', border: 'border-yellow-400', shadow: 'shadow-yellow-400/50' },
  { name: 'Diamond', minElo: 2500, color: 'text-cyan-400', border: 'border-cyan-400', shadow: 'shadow-cyan-400/50' },
] as const

export function getRankTier(elo: number) {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    const tier = RANK_TIERS[i]
    if (tier && elo >= tier.minElo) {
      return tier
    }
  }
  // RANK_TIERS is a non-empty tuple, so index 0 is always defined.
  return RANK_TIERS[0]
}

export function getRankSubTier(elo: number) {
  const tier = getRankTier(elo)
  if (tier.name === 'Diamond') return '' // Diamond has no sub-tiers (or it can have, up to preference)
  const offset = elo - tier.minElo
  if (offset >= 400) return 'I'
  if (offset >= 300) return 'II'
  if (offset >= 200) return 'III'
  if (offset >= 100) return 'IV'
  return 'V' // Base sub-tier
}
