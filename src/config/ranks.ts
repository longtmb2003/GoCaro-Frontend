/*
 * Every class below must be written out in full. Tailwind finds utilities by
 * scanning source text, so a name assembled at runtime — `border.replace(
 * 'border-', 'ring-')` — is never seen and never generated, and the ring falls
 * back to currentColor. Store the class the DOM actually needs.
 *
 * `glow` pairs the design-system --shadow-glow token with a color-only shadow
 * utility; Tailwind compiles theme shadows as `var(--tw-shadow-color, …)`, so
 * the second class recolors the first without an arbitrary value.
 *
 * Bronze is amber-600, not amber-700: on the dark glass surface amber-700
 * measures 3.67:1, below the 4.5:1 WCAG AA floor these 12–13px labels need.
 */
export const RANK_TIERS = [
  {
    name: 'Iron',
    minElo: 0,
    color: 'text-gray-400',
    ring: 'ring-gray-500',
    glow: 'shadow-glow shadow-gray-500/50',
  },
  {
    name: 'Bronze',
    minElo: 1000,
    color: 'text-amber-600',
    ring: 'ring-amber-600',
    glow: 'shadow-glow shadow-amber-600/50',
  },
  {
    name: 'Silver',
    minElo: 1500,
    color: 'text-gray-300',
    ring: 'ring-gray-300',
    glow: 'shadow-glow shadow-gray-300/50',
  },
  {
    name: 'Gold',
    minElo: 2000,
    color: 'text-yellow-400',
    ring: 'ring-yellow-400',
    glow: 'shadow-glow shadow-yellow-400/50',
  },
  {
    name: 'Diamond',
    minElo: 2500,
    color: 'text-cyan-400',
    ring: 'ring-cyan-400',
    glow: 'shadow-glow shadow-cyan-400/50',
  },
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
