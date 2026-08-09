import { ref } from 'vue'
import { fetchActiveShopItems, type ShopItem } from '@/api/shop'
import { fetchAchievementCatalogue } from '@/api/achievement'
import { RANK_TIERS } from '@/config/ranks'

/**
 * What an achievement pays out is a server fact, never a frontend constant.
 * Two sources, because the game pays two different things:
 *
 * - Items come from `shop_items.unlock_achievement`, which names the
 *   achievement that unlocks a free item; the evaluator grants exactly that.
 * - Coins come from `/api/achievements`, because the amounts are env-tunable
 *   and a number hardcoded here would drift the first time they are retuned.
 *
 * An achievement absent from both simply shows no reward, rather than
 * promising one nothing will ever grant.
 *
 * The cache is module level so the page and the modal share one pair of
 * requests; neither source changes within a session.
 */
const rewards = ref<Record<string, ShopItem>>({})
const coins = ref<Record<string, number>>({})
const minElo = ref<Record<string, number>>({})
let loaded = false
let inFlight: Promise<void> | null = null

/**
 * RANK_TIERS has to stay a plain synchronous table: getRankTier decides the
 * badge, frame and colour on the game screen, and making that wait on a fetch
 * would flash every player back to Iron on load. So the table stays, and this
 * check exists to make sure it never quietly disagrees with the thresholds the
 * server actually pays on. Loud in dev, silent in production — a player can do
 * nothing with the warning, but the next person to edit a threshold can.
 */
function warnOnTierDrift(serverElo: Record<string, number>): void {
  if (!import.meta.env.DEV) return

  for (const tier of RANK_TIERS) {
    if (!tier.achievement) continue
    const fromServer = serverElo[tier.achievement]
    if (fromServer !== undefined && fromServer !== tier.minElo) {
      console.error(
        `Rank threshold drift: ${tier.name} is ${String(tier.minElo)} in RANK_TIERS but ` +
          `${String(fromServer)} on the server. The badge and the payout will disagree — ` +
          `update src/config/ranks.ts or the engine's Rank*Elo constants.`,
      )
    }
  }
}

export function useAchievementRewards() {
  function load(): Promise<void> {
    if (loaded) return Promise.resolve()
    if (inFlight) return inFlight

    // allSettled, not all: the coin figure and the item name fail
    // independently, and losing one must not blank the other.
    inFlight = Promise.allSettled([fetchActiveShopItems(), fetchAchievementCatalogue()])
      .then(([shopItems, catalogue]) => {
        if (shopItems.status === 'fulfilled') {
          const map: Record<string, ShopItem> = {}
          for (const item of shopItems.value) {
            if (item.unlock_achievement) {
              map[item.unlock_achievement] = item
            }
          }
          rewards.value = map
        } else {
          console.error('Failed to load achievement item rewards', shopItems.reason)
        }

        if (catalogue.status === 'fulfilled') {
          const coinMap: Record<string, number> = {}
          const eloMap: Record<string, number> = {}
          for (const entry of catalogue.value) {
            if (entry.reward_coins > 0) {
              coinMap[entry.id] = entry.reward_coins
            }
            if (entry.min_elo > 0) {
              eloMap[entry.id] = entry.min_elo
            }
          }
          coins.value = coinMap
          minElo.value = eloMap
          warnOnTierDrift(eloMap)
        } else {
          console.error('Failed to load achievement coin rewards', catalogue.reason)
        }

        loaded = shopItems.status === 'fulfilled' && catalogue.status === 'fulfilled'
      })
      .finally(() => {
        inFlight = null
      })

    return inFlight
  }

  /** Empty string when the achievement grants no item — safe to use in `v-if`. */
  function rewardName(achievementId: string): string {
    return rewards.value[achievementId]?.name ?? ''
  }

  /** Zero when the achievement pays no coins — safe to use in `v-if`. */
  function rewardCoins(achievementId: string): number {
    return coins.value[achievementId] ?? 0
  }

  /**
   * The server's threshold for a rank milestone, falling back to the caller's
   * static value until the catalogue arrives. Screens that *promise* the reward
   * should render this, so the guide can never advertise a threshold the server
   * does not honour.
   */
  function rankMinElo(achievementId: string, fallback: number): number {
    return minElo.value[achievementId] ?? fallback
  }

  return { rewards, coins, load, rewardName, rewardCoins, rankMinElo }
}
