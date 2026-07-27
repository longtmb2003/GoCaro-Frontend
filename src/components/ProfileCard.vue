<script setup lang="ts">
import { computed, ref } from 'vue'

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

const fireIcon = computed(() => {
  if (streak.value >= 100) return '🔥 (Blue)' // Placeholder for blue fire emoji or icon
  if (streak.value >= 50) return '🔥 (Purple)'
  if (streak.value >= 10) return '🔥 (Orange)'
  if (streak.value >= 1) return '🔥'
  return ''
})

const fireClass = computed(() => {
  if (streak.value >= 100) return 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
  if (streak.value >= 50) return 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
  if (streak.value >= 10) return 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
  return 'text-orange-400'
})

const currentLevelBase = computed(() => Math.floor(props.elo / 100) * 100)
const nextLevelMax = computed(() => currentLevelBase.value + 100)
const progressPercent = computed(() => ((props.elo - currentLevelBase.value) / 100) * 100)

const badgesExpanded = ref(false)

const displayCoins = useCountUp(() => props.stats?.coins || 0)
</script>

<template>
  <section
    class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-xl border p-4 sm:p-6 shadow-lg relative overflow-hidden group"
    aria-label="Your profile"
  >
    <!-- Background highlight -->
    <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-colors"></div>

    <div class="flex items-center gap-4 relative z-10">
      <RankFrame :elo="elo" :initial="initial" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <p class="text-foreground truncate text-lg font-bold">{{ username }}</p>
          <span
            v-if="isGuest"
            class="bg-warning-500/15 text-warning-600 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          >
            Guest
          </span>
        </div>
        <p class="text-foreground-muted text-xs font-medium mt-0.5 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          {{ isGuest ? 'Practice Mode' : 'Online' }}
        </p>
      </div>
    </div>

    <div class="border-border-subtle mt-4 sm:mt-6 border-t pt-4 sm:pt-5 relative z-10">
      <div class="flex flex-col items-center justify-center mb-3 sm:mb-4">
        <p class="text-foreground-muted text-xs font-semibold uppercase tracking-widest mb-1">Rating</p>
        <div class="text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent drop-shadow-sm tabular-nums">
          {{ elo }}
        </div>
        <div class="mt-2 font-bold text-sm flex items-center gap-1.5" :class="rankColor">
          <span class="opacity-80">♦</span> {{ rankTier }}
        </div>
      </div>
      
      <div class="grid grid-cols-3 gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-subtle/50">
        <div class="text-center">
          <div class="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
            <span class="text-yellow-400">🟡</span> Coins
          </div>
          <div class="text-sm font-bold text-foreground mt-0.5">{{ displayCoins }}</div>
        </div>
        <div class="text-center">
          <div class="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold">Win Rate</div>
          <div class="text-sm font-bold text-foreground mt-0.5">{{ winRate }}%</div>
        </div>
        <div class="text-center">
          <div class="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold">Streak</div>
          <div class="text-sm font-bold mt-0.5 flex items-center justify-center gap-1" :class="streak > 0 ? 'text-success-400' : 'text-foreground-muted'">
            <span v-if="streak > 0">+{{ streak }}</span>
            <span v-else>{{ streak }}</span>
            <span v-if="streak > 0" :class="[fireClass, 'animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]']" class="text-base inline-block">{{ fireIcon.split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <!-- Streak Restore (Placeholder) -->
      <div v-if="streak === 0 && stats && stats.matches_played > 0" class="mt-2 text-center">
        <button class="text-[10px] font-semibold text-primary-400 hover:text-primary-300 opacity-60 cursor-not-allowed" disabled>
          Restore Streak (Coming Soon)
        </button>
      </div>

      <!-- Rank Progress Bar -->
      <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-subtle/50">
        <div class="flex justify-between items-end text-xs text-foreground font-medium mb-1.5">
          <span :class="rankColor" class="font-bold tracking-wide">{{ rankTier }}</span>
          <span class="text-[10px] text-foreground-muted tabular-nums font-bold tracking-wider">{{ elo }} / {{ nextLevelMax }}</span>
        </div>
        <div class="h-2.5 w-full bg-surface-sunken rounded-sm overflow-hidden border border-border-subtle/30 shadow-inner">
          <div class="h-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all duration-1000 ease-out" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>
      
      <!-- Customization Teasers -->
      <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-subtle/50 grid grid-cols-2 gap-2 text-xs">
        <div class="bg-surface rounded border border-border-subtle p-2 flex flex-col cursor-not-allowed opacity-80 hover:opacity-100 transition-opacity">
          <span class="text-[9px] uppercase tracking-widest text-foreground-muted font-bold">Title</span>
          <span class="text-foreground font-medium mt-0.5 truncate">Novice</span>
        </div>
        <div class="bg-surface rounded border border-border-subtle p-2 flex flex-col cursor-not-allowed opacity-80 hover:opacity-100 transition-opacity">
          <span class="text-[9px] uppercase tracking-widest text-foreground-muted font-bold">Background</span>
          <span class="text-foreground font-medium mt-0.5 truncate">Default</span>
        </div>
      </div>

      <!-- Achievements / Badges (Mock) -->
      <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-subtle/50">
        <button 
          class="w-full flex items-center justify-between text-xs text-foreground-muted font-semibold uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer"
          @click="badgesExpanded = !badgesExpanded"
        >
          <span class="flex items-center gap-1.5">🏆 4 Badges Unlocked</span>
          <span class="transform transition-transform duration-200" :class="badgesExpanded ? 'rotate-90' : ''">›</span>
        </button>
        <div v-show="badgesExpanded" class="flex gap-2 mt-3 [animation:fade-in_0.2s_ease-out_forwards]">
          <div class="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-sm shadow-inner opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-help" title="First Victory">🏆</div>
          <div class="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-sm shadow-inner opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-help" title="5 Win Streak">🔥</div>
          <div class="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-sm shadow-inner opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-help" title="Veteran Player">⭐</div>
          <div class="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-sm shadow-inner opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-help" title="Top 100 Rank">👑</div>
        </div>
      </div>

      <!-- Guest Upsell -->
      <div v-if="isGuest" class="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <p class="text-xs font-bold text-primary-400 mb-2 uppercase tracking-wide">Sign in to:</p>
        <ul class="text-xs text-foreground-muted space-y-1 font-medium">
          <li class="flex items-center gap-1.5"><span class="text-success-400">✓</span> Earn Coins</li>
          <li class="flex items-center gap-1.5"><span class="text-success-400">✓</span> Unlock Avatars</li>
          <li class="flex items-center gap-1.5"><span class="text-success-400">✓</span> Join Leaderboard</li>
        </ul>
      </div>
    </div>

  </section>
</template>
