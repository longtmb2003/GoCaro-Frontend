<script setup lang="ts">
import { computed } from 'vue'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseProgress from '@/components/ui/BaseProgress.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import type { AccountType } from '@/types/auth'
import { useCountUp } from '@/composables/useCountUp'

import RankFrame from './RankFrame.vue'
import { getRankTier, getRankSubTier } from '@/config/ranks'
import type { UserStats } from '@/types/auth'

const props = defineProps<{
  username: string
  elo: number
  accountType: AccountType
  stats?: UserStats
}>()

const initial = computed(() => props.username.charAt(0).toUpperCase())
const isGuest = computed(() => props.accountType === 'anonymous')

const rankTier = computed(() => {
  const tier = getRankTier(props.elo)
  const subTier = getRankSubTier(props.elo)
  return `${tier.name} ${subTier}`.trim()
})

const rankColor = computed(() => getRankTier(props.elo).color)

const winRate = computed(() => {
  if (!props.stats || props.stats.matches_played === 0) return 0
  return Math.round((props.stats.wins / props.stats.matches_played) * 100)
})

const streak = computed(() => props.stats?.current_streak || 0)

const currentLevelBase = computed(() => Math.floor(props.elo / 100) * 100)
const nextLevelMax = computed(() => currentLevelBase.value + 100)
const progressPercent = computed(() => ((props.elo - currentLevelBase.value) / 100) * 100)

const displayCoins = useCountUp(() => props.stats?.coins || 0)
</script>

<template>
  <GlassCard as="section" aria-label="Your profile">
    <div class="flex items-center gap-4">
      <RankFrame :elo="elo" :initial="initial" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <p class="text-foreground text-card truncate">{{ username }}</p>
          <BaseBadge v-if="isGuest" variant="warning" shape="tag" class="shrink-0">Guest</BaseBadge>
        </div>
        <p class="text-foreground-muted text-small mt-1 flex items-center gap-2">
          <span class="bg-success size-1.5 rounded-pill" aria-hidden="true" />
          {{ isGuest ? 'Practice Mode' : 'Online' }}
        </p>
      </div>
    </div>

    <div class="border-border-subtle mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
      <div class="flex flex-col items-center justify-center mb-3 sm:mb-4">
        <p class="text-foreground-muted text-caption font-semibold uppercase tracking-widest mb-1">
          Rating
        </p>
        <div
          class="text-page sm:text-hero bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent tabular-nums"
        >
          {{ elo }}
        </div>
        <div class="mt-2 text-small font-bold flex items-center gap-2" :class="rankColor">
          <span class="opacity-80">♦</span> {{ rankTier }}
        </div>
      </div>

      <div class="border-border-subtle grid grid-cols-3 gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
        <div class="text-center">
          <div
            class="text-caption text-foreground-muted uppercase tracking-wider font-semibold flex items-center justify-center gap-1"
          >
            <span class="text-warning" aria-hidden="true">🟡</span> Coins
          </div>
          <div class="text-small font-bold text-foreground mt-1">{{ displayCoins }}</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-foreground-muted uppercase tracking-wider font-semibold">
            Win Rate
          </div>
          <div class="text-small font-bold text-foreground mt-1">{{ winRate }}%</div>
        </div>
        <div class="text-center">
          <div class="text-caption text-foreground-muted uppercase tracking-wider font-semibold">
            Streak
          </div>
          <div
            class="text-small font-bold mt-1 flex items-center justify-center gap-1"
            :class="streak > 0 ? 'text-success' : 'text-foreground-muted'"
          >
            <span v-if="streak > 0">+{{ streak }}</span>
            <span v-else>{{ streak }}</span>
            <span v-if="streak > 0" class="text-warning" aria-hidden="true">🔥</span>
          </div>
        </div>
      </div>

      <!-- Streak Restore (Placeholder) -->
      <div v-if="streak === 0 && stats && stats.matches_played > 0" class="mt-2 text-center">
        <button
          class="text-caption font-semibold text-accent opacity-60 cursor-not-allowed"
          disabled
        >
          Restore Streak (Coming Soon)
        </button>
      </div>

      <!-- Rank Progress Bar -->
      <div class="border-border-subtle mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
        <div class="flex justify-between items-end text-caption text-foreground font-medium mb-2">
          <span :class="rankColor" class="font-bold tracking-wide">{{ rankTier }}</span>
          <span class="text-caption text-foreground-muted tabular-nums font-bold tracking-wider">
            {{ elo }} / {{ nextLevelMax }}
          </span>
        </div>
        <BaseProgress :value="progressPercent" :label="`Progress to ${nextLevelMax.toString()} rating`" />
      </div>

      <!-- Customization Teasers -->
      <div class="border-border-subtle mt-3 sm:mt-4 pt-3 sm:pt-4 grid grid-cols-2 gap-2 border-t">
        <GlassCard
          as="div"
          variant="nested"
          class="flex flex-col cursor-not-allowed opacity-80 hover:opacity-100 transition-opacity"
        >
          <span class="text-caption uppercase tracking-widest text-foreground-muted font-bold">
            Title
          </span>
          <span class="text-foreground-muted text-small font-medium mt-1 truncate">Coming soon</span>
        </GlassCard>
        <GlassCard
          as="div"
          variant="nested"
          class="flex flex-col cursor-not-allowed opacity-80 hover:opacity-100 transition-opacity"
        >
          <span class="text-caption uppercase tracking-widest text-foreground-muted font-bold">
            Background
          </span>
          <span class="text-foreground-muted text-small font-medium mt-1 truncate">Coming soon</span>
        </GlassCard>
      </div>

      <!-- Achievements. The badge system is not built, so this states that
           rather than inventing a count and a set of unlocked badges. -->
      <div class="border-border-subtle mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
        <div
          class="text-caption text-foreground-muted font-semibold uppercase tracking-widest flex items-center justify-between"
        >
          <span class="flex items-center gap-2">🏆 Badges</span>
          <span>Coming soon</span>
        </div>
      </div>

      <!-- Guest Upsell -->
      <div v-if="isGuest" class="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-sm">
        <p class="text-caption font-bold text-accent mb-2 uppercase tracking-wide">Sign in to:</p>
        <ul class="text-caption text-foreground-muted space-y-2 font-medium">
          <li class="flex items-center gap-2"><span class="text-success">✓</span> Earn Coins</li>
          <li class="flex items-center gap-2"><span class="text-success">✓</span> Unlock Avatars</li>
          <li class="flex items-center gap-2"><span class="text-success">✓</span> Join Leaderboard</li>
        </ul>
      </div>
    </div>
  </GlassCard>
</template>
