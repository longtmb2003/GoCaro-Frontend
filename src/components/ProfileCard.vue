<script setup lang="ts">
import { computed } from 'vue'

import { Check, Coins, Diamond, Flame, Lock, Pencil, Trophy } from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseProgress from '@/components/ui/BaseProgress.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import type { AccountType } from '@/types/auth'
import { useCountUp } from '@/composables/useCountUp'

import RankFrame from './RankFrame.vue'
import { getRankTier, getRankSubTier } from '@/config/ranks'
import type { UserStats } from '@/types/auth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { openProfile } = useUserProfile()

const props = defineProps<{
  displayName: string
  elo: number
  accountType: AccountType
  stats?: UserStats
}>()

const emit = defineEmits<{ edit: [], upgrade: [] }>()

const initial = computed(() => props.displayName.charAt(0).toUpperCase())
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
          <p class="text-foreground text-card truncate">{{ displayName }}</p>
          <BaseBadge v-if="isGuest" variant="warning" shape="tag" class="shrink-0">Guest</BaseBadge>
          <!-- A guest has no profile to edit: nothing about them outlives the
               session, and they have no handle to fall back to. -->
          <button
            v-else
            type="button"
            class="text-foreground-muted hover:text-foreground duration-fast shrink-0 p-1 transition"
            aria-label="Edit profile"
            @click="emit('edit')"
          >
            <Pencil :size="16" aria-hidden="true" />
          </button>
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
        <div class="mt-2 text-small font-bold flex items-center gap-2 px-3 py-1 rounded bg-surface-sunken border border-border-subtle shadow-inner" :class="rankColor">
          <Diamond :size="16" class="opacity-80" aria-hidden="true" /> {{ rankTier }}
        </div>
      </div>

      <div class="border-border-subtle grid grid-cols-3 gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
        <div class="text-center">
          <div
            class="text-caption text-foreground-muted uppercase tracking-wider font-semibold flex items-center justify-center gap-1"
          >
            <Coins :size="16" class="text-warning" aria-hidden="true" /> Coins
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
            <Flame v-if="streak > 0" :size="16" class="text-warning" aria-hidden="true" />
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
          <span :class="rankColor" class="font-bold tracking-wide px-2 py-0.5 rounded bg-surface-sunken border border-border-subtle">{{ rankTier }}</span>
          <span class="text-caption text-foreground-muted tabular-nums font-bold tracking-wider">
            {{ elo }} / {{ nextLevelMax }}
          </span>
        </div>
        <BaseProgress :value="progressPercent" :label="`Progress to ${nextLevelMax.toString()} rating`" />
      </div>
      
      <!-- Competitive Profile Button -->
      <div class="mt-4">
        <button
          @click="!auth.isGuest ? openProfile(auth.user?.id || '') : emit('upgrade')"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-800/50 hover:bg-surface-700/50 border border-border-subtle rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Lock v-if="auth.isGuest" :size="16" class="text-white/50" />
          <Trophy v-else :size="16" class="text-primary-400" />
          View Competitive Profile
        </button>
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
          <span class="flex items-center gap-2"><Trophy :size="16" aria-hidden="true" /> Badges</span>
          <span>Coming soon</span>
        </div>
      </div>

      <!-- Guest Upsell -->
      <div v-if="isGuest" class="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-sm">
        <p class="text-caption font-bold text-accent mb-2 uppercase tracking-wide">Sign in to:</p>
        <ul class="text-caption text-foreground-muted space-y-2 font-medium">
          <li class="flex items-center gap-2"><Check :size="16" class="text-success" aria-hidden="true" /> Earn Coins</li>
          <li class="flex items-center gap-2"><Check :size="16" class="text-success" aria-hidden="true" /> Unlock Avatars</li>
          <li class="flex items-center gap-2"><Check :size="16" class="text-success" aria-hidden="true" /> Join Leaderboard</li>
        </ul>
      </div>
    </div>
  </GlassCard>
</template>
