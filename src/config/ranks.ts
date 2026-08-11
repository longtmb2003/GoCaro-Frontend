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
/*
 * `achievement` names the backend achievement a tier unlocks, or null when the
 * tier pays nothing. It is written out rather than derived from `name`, because
 * a derived id would silently stop matching the day a tier is renamed and the
 * reward would just quietly disappear from the UI. The payout figure itself is
 * never stored here — it is env-tunable and comes from /api/achievements.
 * Thresholds must stay in step with the engine's Rank*Elo constants.
 */
export const RANK_TIERS = [
  {
    name: 'Iron',
    minElo: 0,
    achievement: null,
    color: 'text-gray-400',
    ring: 'ring-gray-500',
    glow: 'shadow-glow shadow-gray-500/50',
  },
  {
    name: 'Bronze',
    minElo: 1000,
    achievement: null,
    color: 'text-amber-600',
    ring: 'ring-amber-600',
    glow: 'shadow-glow shadow-amber-600/50',
  },
  {
    name: 'Silver',
    minElo: 1150,
    achievement: 'rank_silver',
    color: 'text-gray-300',
    ring: 'ring-gray-300',
    glow: 'shadow-glow shadow-gray-300/50',
  },
  {
    name: 'Gold',
    minElo: 1300,
    achievement: 'rank_gold',
    color: 'text-yellow-400',
    ring: 'ring-yellow-400',
    glow: 'shadow-glow shadow-yellow-400/50',
  },
  {
    name: 'Diamond',
    minElo: 1450,
    achievement: 'rank_diamond',
    color: 'text-primary-300',
    ring: 'ring-primary-300',
    glow: 'shadow-glow shadow-primary-300/50',
  },
] as const

export type RankName = (typeof RANK_TIERS)[number]['name']

export const RANK_SUB_TIER_ELO = 50

export interface RankProgress {
  currentThreshold: number
  nextThreshold: number | null
  percent: number
}

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
  if (tier.name === 'Iron' || tier.name === 'Diamond') return ''
  const offset = elo - tier.minElo
  if (offset >= RANK_SUB_TIER_ELO * 2) return 'I'
  if (offset >= RANK_SUB_TIER_ELO) return 'II'
  return 'III'
}

/**
 * Returns progress to the next real rank milestone. Iron progresses directly
 * to Bronze; Bronze through Gold progress in 50-Elo sub-tiers; Diamond is the
 * highest tier and therefore has no next threshold.
 */
export function getRankProgress(elo: number): RankProgress {
  const safeElo = Math.max(0, elo)
  const tier = getRankTier(safeElo)

  if (tier.name === 'Diamond') {
    return {
      currentThreshold: tier.minElo,
      nextThreshold: null,
      percent: 100,
    }
  }

  const tierIndex = RANK_TIERS.findIndex((candidate) => candidate.name === tier.name)
  const nextTier = RANK_TIERS[tierIndex + 1]

  if (!nextTier) {
    return {
      currentThreshold: tier.minElo,
      nextThreshold: null,
      percent: 100,
    }
  }

  const currentThreshold = tier.name === 'Iron'
    ? tier.minElo
    : tier.minElo + Math.floor((safeElo - tier.minElo) / RANK_SUB_TIER_ELO) * RANK_SUB_TIER_ELO
  const nextThreshold = tier.name === 'Iron'
    ? nextTier.minElo
    : Math.min(currentThreshold + RANK_SUB_TIER_ELO, nextTier.minElo)
  const span = nextThreshold - currentThreshold
  const percent = span > 0
    ? Math.min(100, Math.max(0, ((safeElo - currentThreshold) / span) * 100))
    : 100

  return { currentThreshold, nextThreshold, percent }
}
