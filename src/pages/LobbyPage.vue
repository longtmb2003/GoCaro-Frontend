<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import BaseButton from '@/components/BaseButton.vue'
import GuestLogoutDialog from '@/components/GuestLogoutDialog.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import LeaderboardModal from '@/components/LeaderboardModal.vue'
import MatchmakingModal from '@/components/MatchmakingModal.vue'
import PlayPanel from '@/components/PlayPanel.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import OnlineUsersModal from '@/components/OnlineUsersModal.vue'
import UpgradeAccountModal from '@/components/UpgradeAccountModal.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useLobbyStore } from '@/stores/lobby'
import { useSocketStore } from '@/stores/socket'
import { useToast } from '@/composables/useToast'
import { useCountUp } from '@/composables/useCountUp'
import type { Credentials } from '@/types/auth'

const auth = useAuthStore()
const historyStore = useHistoryStore()
const leaderboard = useLeaderboardStore()
const socket = useSocketStore()
const lobby = useLobbyStore()
const { addToast } = useToast()
const router = useRouter()

const displayCoins = useCountUp(() => auth.user?.stats.coins ?? 0)

const upgradeOpen = ref(false)
const upgradeLoading = ref(false)
const upgradeError = ref('')
const guestLogoutOpen = ref(false)
const leaderboardModalOpen = ref(false)

onMounted(() => {
  void leaderboard.load()
  void historyStore.load(1)
  lobby.connect()
})

onUnmounted(() => {
  lobby.disconnect()
})

const onlineModalOpen = ref(false)

const paginatedOnlineUsers = computed(() => {
  return lobby.onlineUsers.slice(0, 4)
})

const paginatedLeaderboard = computed(() => {
  return leaderboard.entries.slice(0, 10)
})

const isMatchmaking = computed(
  () =>
    socket.status === 'connecting' || socket.status === 'searching' || socket.status === 'error',
)

watch(
  () => socket.status,
  (status) => {
    if (status === 'matched') {
      void router.push('/game')
    }
  },
)

function openUpgrade(): void {
  upgradeError.value = ''
  guestLogoutOpen.value = false
  upgradeOpen.value = true
}

async function handleUpgrade(credentials: Credentials): Promise<void> {
  upgradeLoading.value = true
  upgradeError.value = ''
  try {
    await auth.upgrade(credentials)
    upgradeOpen.value = false
    // The player now has a username and a rating that counts, so the board they
    // are about to appear on is stale.
    void leaderboard.load()
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error
    }
    upgradeError.value = error.message
  } finally {
    upgradeLoading.value = false
  }
}

/**
 * A guest has no credentials to sign back in with, so logging out destroys the
 * account. Registered players keep the one-click behaviour.
 */
async function handleLogout(): Promise<void> {
  if (auth.isGuest) {
    guestLogoutOpen.value = true
    return
  }
  await logout()
}

async function logout(): Promise<void> {
  guestLogoutOpen.value = false
  auth.logout()
  await router.push('/login')
}

async function shareGame(): Promise<void> {
  const onSuccess = () => {
    if (auth.user) {
      addToast('Link shared! Thanks for sharing!', 'success')
    }
  }

  // `navigator.share` is typed as always present but is absent in many browsers.
  // Cast to a possibly-undefined function so the feature check is real and the
  // fallback branch keeps full access to `navigator`.
  const nativeShare = (navigator.share as ((data: ShareData) => Promise<void>) | undefined)?.bind(
    navigator,
  )
  if (nativeShare) {
    try {
      await nativeShare({
        title: 'GoCaro - Play Gomoku Online',
        text: 'Join me for a game of Gomoku on GoCaro!',
        url: window.location.origin,
      })
      const granted = await auth.shareAchievement()
      if (granted) addToast('You earned 50 Coins for sharing!', 'success')
    } catch {
      // The user dismissed the share sheet, or sharing failed; nothing to recover.
    }
  } else {
    void navigator.clipboard.writeText(window.location.origin)
    const granted = await auth.shareAchievement()
    if (granted) addToast('You earned 50 Coins for sharing!', 'success')
    onSuccess()
  }
}

const missionPlay2Status = computed(() => {
  const daily = auth.user?.stats.daily_matches ?? 0
  return daily >= 2 ? 'Completed' : `${daily.toString()} / 2`
})

const missionShareStatus = computed(() => {
  const shared = auth.user?.stats.last_share_date
  if (!shared) return 'Incomplete'
  const today = new Date().toISOString().split('T')[0]
  if (!today) return 'Incomplete'
  return shared.startsWith(today) ? 'Completed' : 'Incomplete'
})

const recentMatch = computed(() => {
  if (!auth.user) return null
  return historyStore.matches.find(
    (m) => m.player1_id === auth.user?.id || m.player2_id === auth.user?.id
  )
})
</script>

<template>
  <AppLayout title="GoCaro">
    <template #actions>
      <span v-if="auth.user" class="text-foreground-muted hidden text-sm sm:inline">
        {{ auth.displayName }}
      </span>
      <BaseButton variant="secondary" @click="handleLogout">Log out</BaseButton>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
      <!-- Left Column: Profile & Online Users -->
      <div class="contents lg:flex lg:flex-col lg:gap-4 lg:col-span-3">
        <div class="relative order-3 md:order-3 md:col-span-1 lg:order-none">
          <ProfileCard
            v-if="auth.user"
            :username="auth.displayName"
            :elo="auth.user.elo"
            :account-type="auth.user.account_type"
            :stats="auth.user.stats"
          />
        </div>

        <!-- Online Users Section -->
        <section
          v-if="auth.isAuthenticated"
          class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-xl border p-4 shadow-lg hover:shadow-primary-500/10 transition-shadow order-8 md:order-8 md:col-span-1 lg:order-none"
          aria-label="Online Users"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-foreground text-sm font-semibold flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
              Online ({{ lobby.onlineUsers.length }})
            </h2>
            <div class="flex items-center gap-1">
              <button class="cursor-pointer text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors border border-primary-500/20 rounded px-2 py-1 bg-surface-elevated/50 shadow-sm" @click="onlineModalOpen = true">
                View All
              </button>
            </div>
          </div>
          
          <div v-if="lobby.onlineUsers.length === 0" class="text-foreground-muted py-4 text-center text-xs">
            No one online.
          </div>
          <div v-else class="grid grid-cols-2 gap-2 mt-2">
            <div v-for="user in paginatedOnlineUsers" :key="user.id" class="border border-border-subtle rounded-lg p-2 flex items-center gap-2 bg-surface hover:bg-surface-elevated shadow-sm transition-colors cursor-default">
              <div class="relative">
                <div class="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 border border-surface rounded-full"></div>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-medium truncate text-foreground">{{ user.username }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Daily Missions -->
        <section
          v-if="auth.isAuthenticated"
          class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-xl border p-4 shadow-lg relative overflow-hidden group hover:shadow-primary-500/10 transition-all order-4 md:order-5 md:col-span-1 lg:order-none"
          aria-label="Daily Missions"
        >
          <div class="absolute -right-4 -top-4 text-6xl opacity-5 pointer-events-none group-hover:scale-110 transition-transform">🎯</div>
          <h2 class="text-foreground text-sm font-semibold flex items-center gap-2 mb-3 relative z-10">
            <span>🎯</span> Daily Missions
          </h2>
          <div class="space-y-3 relative z-10">
            
            <div class="bg-surface rounded-lg p-2 border border-border-subtle flex flex-col gap-1.5 shadow-sm">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-foreground">Play 2 Matches</span>
                <span class="text-[10px] text-primary-400 font-bold">+50 Coins</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                  <div class="h-full bg-primary-500 transition-all" :style="{ width: missionPlay2Status === 'Completed' ? '100%' : (auth.user?.stats?.matches_played || 0) % 2 === 1 ? '50%' : '0%' }"></div>
                </div>
                <span class="text-[10px] font-medium text-foreground-muted tabular-nums">
                  {{ missionPlay2Status === 'Completed' ? '2 / 2' : ((auth.user?.stats?.matches_played || 0) % 2) + ' / 2' }}
                </span>
              </div>
            </div>

            <div class="bg-surface rounded-lg p-2 border border-border-subtle flex flex-col gap-1.5 shadow-sm">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-foreground">Share with friends</span>
                <span class="text-[10px] text-primary-400 font-bold">+50 Coins</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                  <div class="h-full bg-primary-500 transition-all" :style="{ width: missionShareStatus === 'Completed' ? '100%' : '0%' }"></div>
                </div>
                <span class="text-[10px] font-medium text-foreground-muted tabular-nums">
                  {{ missionShareStatus === 'Completed' ? '1 / 1' : '0 / 1' }}
                </span>
              </div>
            </div>

            <div class="text-center pt-2 border-t border-border-subtle mt-2">
              <p class="text-xs text-foreground-muted font-semibold tracking-wide">
                TOTAL COINS: <span class="text-primary-400">{{ displayCoins }}</span>
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Center Column: Hero & Play Panel -->
      <div class="contents lg:flex lg:flex-col lg:gap-4 lg:col-span-6">
        <div class="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative min-h-[12rem] md:h-48 group order-1 md:order-1 md:col-span-2 lg:order-none">
          <img src="/gomoku_board.png" alt="GoCaro Board" class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 lg:group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-0"></div>
          
          <!-- Animated Light Sweep -->
          <div class="absolute inset-0 opacity-20 z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-15deg] [animation:light-sweep_4s_infinite]"></div>
          
          <!-- Decorative Floating Icons -->
          <div class="absolute top-4 right-6 text-2xl opacity-80 animate-bounce hidden sm:block" style="animation-duration: 3s;">🎮</div>
          <div class="absolute top-10 left-1/4 text-xl opacity-60 animate-pulse hidden sm:block">✨</div>
          <div class="absolute bottom-6 right-1/4 text-3xl opacity-90 animate-pulse hidden sm:block" style="animation-delay: 1s;">🏆</div>

          <div class="absolute bottom-0 left-0 p-5">
            <h1 class="text-3xl font-bold text-white drop-shadow-lg flex items-center gap-2">
              GoCaro <span class="inline-block hover:animate-spin text-2xl cursor-default transition-all duration-300">👋</span>
            </h1>
            <p class="text-white/90 mt-1 text-sm font-medium drop-shadow-md">The ultimate online Gomoku experience.</p>
          </div>
        </div>

        <PlayPanel
          class="order-2 md:order-2 md:col-span-2 lg:order-none"
          :is-guest="auth.isGuest"
          @play="socket.startMatchmaking($event)"
          @upgrade="openUpgrade"
        />

        <div class="order-5 md:order-6 md:col-span-1 lg:order-none flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-3">
          <RouterLink
            to="/history"
            class="cursor-pointer border-border-subtle bg-surface/80 backdrop-blur-md hover:bg-surface-elevated block rounded-lg border p-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
          >
            <span class="text-lg group-hover:scale-110 transition-transform">📜</span>
            <span class="text-foreground">Match history</span>
          </RouterLink>

          <button
            class="cursor-pointer border-border-subtle bg-surface/80 backdrop-blur-md hover:bg-surface-elevated block rounded-lg border p-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md group w-full relative overflow-hidden"
            @click="shareGame"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-success-500/10 to-transparent pointer-events-none"></div>
            <span class="text-lg group-hover:scale-110 transition-transform">🔗</span>
            <div class="flex flex-col items-start">
              <span class="text-foreground leading-tight">Share with friends</span>
              <span class="text-primary-400 text-[10px] font-bold">+50 Coins</span>
            </div>
          </button>
          </div>

          <!-- Recent Match Preview -->
          <div class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-lg border p-4 shadow-sm relative overflow-hidden group">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-foreground text-sm font-bold flex items-center gap-2">
              <span>⚔️</span> Recent Match
            </h3>
            <RouterLink to="/history" class="text-xs font-medium text-primary-400 hover:text-primary-300">View All</RouterLink>
          </div>
          
          <div v-if="!recentMatch" class="text-center py-4 bg-surface-sunken rounded-lg border border-border-subtle/50">
            <p class="text-foreground-muted text-xs">No matches yet. Play your first game!</p>
          </div>
          <div v-else class="flex items-center justify-between p-3 bg-surface-sunken rounded-lg border border-border-subtle/50 transition-colors hover:border-primary-500/30 cursor-default">
            <div class="flex flex-col">
              <span class="text-sm font-bold" :class="recentMatch.winner_id === auth.user?.id ? 'text-success-400' : (recentMatch.winner_id ? 'text-danger-400' : 'text-foreground-muted')">
                {{ recentMatch.winner_id === auth.user?.id ? 'Victory' : (recentMatch.winner_id ? 'Defeat' : 'Draw') }}
              </span>
              <span class="text-[10px] text-foreground-muted uppercase tracking-wide">{{ recentMatch.is_ranked ? 'Ranked' : 'Practice' }} • {{ recentMatch.total_moves }} Moves</span>
            </div>
            <div class="text-xs text-foreground-muted text-right">
              {{ new Date(recentMatch.created_at).toLocaleDateString() }}
            </div>
          </div>
        </div>
        </div>

        <!-- Shop Preview -->
        <div class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-lg border p-4 shadow-sm relative overflow-hidden order-7 md:order-7 md:col-span-2 lg:order-none">
          <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 pointer-events-none">🛍️</div>
          <h3 class="text-foreground text-sm font-bold flex items-center gap-2 mb-3 relative z-10">
            <span>🛍️</span> Store <span class="bg-primary-500 text-white text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ml-2">Preview</span>
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
            <div class="bg-surface rounded-lg p-2 flex flex-col items-center justify-center border border-border-subtle text-center hover:border-primary-500/30 transition-all cursor-pointer group relative overflow-hidden">
              <span class="text-xl group-hover:-translate-y-4 transition-transform duration-300">👤</span>
              <span class="text-[9px] font-semibold text-foreground-muted mt-1 uppercase group-hover:opacity-0 transition-opacity duration-300">Avatars</span>
              <div class="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-primary-500/10 p-1">
                <span class="text-[8px] font-bold text-primary-400 uppercase tracking-widest">12 Items</span>
              </div>
            </div>
            <div class="bg-surface rounded-lg p-2 flex flex-col items-center justify-center border border-border-subtle text-center hover:border-primary-500/30 transition-all cursor-pointer group relative overflow-hidden">
              <span class="text-xl group-hover:-translate-y-4 transition-transform duration-300">🖼️</span>
              <span class="text-[9px] font-semibold text-foreground-muted mt-1 uppercase group-hover:opacity-0 transition-opacity duration-300">Borders</span>
              <div class="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-primary-500/10 p-1">
                <span class="text-[8px] font-bold text-primary-400 uppercase tracking-widest">Season 1</span>
              </div>
            </div>
            <div class="bg-surface rounded-lg p-2 flex flex-col items-center justify-center border border-border-subtle text-center hover:border-primary-500/30 transition-all cursor-pointer group relative overflow-hidden">
              <span class="text-xl group-hover:-translate-y-4 transition-transform duration-300">🎨</span>
              <span class="text-[9px] font-semibold text-foreground-muted mt-1 uppercase group-hover:opacity-0 transition-opacity duration-300">Themes</span>
              <div class="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-primary-500/10 p-1">
                <span class="text-[8px] font-bold text-primary-400 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>
            <div class="bg-surface rounded-lg p-2 flex flex-col items-center justify-center border border-border-subtle text-center hover:border-primary-500/30 transition-all cursor-pointer group relative overflow-hidden">
              <span class="text-xl group-hover:-translate-y-4 transition-transform duration-300">😎</span>
              <span class="text-[9px] font-semibold text-foreground-muted mt-1 uppercase group-hover:opacity-0 transition-opacity duration-300">Emojis</span>
              <div class="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-primary-500/10 p-1">
                <span class="text-[8px] font-bold text-primary-400 uppercase tracking-widest">Unlock Later</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Leaderboard & Stats -->
      <div class="contents lg:flex lg:flex-col lg:gap-4 lg:col-span-3">
        <section
          class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-xl border p-4 shadow-lg hover:shadow-primary-500/10 transition-shadow relative overflow-hidden order-6 md:order-4 md:col-span-1 lg:order-none"
          aria-label="Leaderboard"
        >
          <div class="absolute -right-10 -top-10 text-9xl opacity-5 pointer-events-none">👑</div>
          <div class="mb-3 flex items-center justify-between relative z-10">
            <h2 class="text-foreground text-sm font-semibold flex items-center gap-2">
              <span class="text-lg drop-shadow-sm">👑</span> Leaderboard
            </h2>
          </div>

          <div v-if="leaderboard.loading" class="text-foreground-muted py-8 text-center text-xs relative z-10">
            Loading…
          </div>

          <div v-else-if="leaderboard.error" class="py-8 text-center relative z-10">
            <p class="text-danger-400 text-xs">{{ leaderboard.error }}</p>
            <BaseButton variant="secondary" class="mt-3 text-xs py-1 px-2" @click="leaderboard.load()">
              Retry
            </BaseButton>
          </div>

          <div v-else class="overflow-y-auto pr-1 custom-scrollbar relative z-10 max-h-48 sm:max-h-64 lg:max-h-none">
            <LeaderboardTable
              :entries="paginatedLeaderboard"
              :current-username="auth.user?.username ?? ''"
              compact
            />
            
            <div class="mt-3 text-center">
              <button
                class="cursor-pointer inline-block text-primary-400 hover:text-primary-300 hover:underline underline-offset-2 text-xs font-medium transition-colors"
                @click="leaderboardModalOpen = true"
              >
                View all rankings →
              </button>
            </div>
          </div>
        </section>

        <!-- System Status -->
        <section
          class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-xl border p-4 shadow-lg relative overflow-hidden group hover:shadow-primary-500/10 transition-all order-9 md:order-9 md:col-span-1 lg:order-none"
          aria-label="System Status"
        >
          <div class="absolute -right-4 -bottom-4 text-7xl opacity-5 pointer-events-none group-hover:scale-110 transition-transform">⚡</div>
          <h2 class="text-foreground text-sm font-semibold flex items-center gap-2 mb-3 relative z-10">
            <span>⚡</span> System Status
          </h2>
          <div class="grid grid-cols-2 gap-2 relative z-10">
            <div class="bg-surface rounded p-2 text-center border border-border-subtle relative overflow-hidden">
              <div class="text-[10px] text-foreground-muted uppercase tracking-wide font-semibold mb-1">Realtime</div>
              <div class="flex items-center justify-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
                <span class="text-sm font-bold text-success-400">Connected</span>
              </div>
            </div>
            <div class="bg-surface rounded p-2 text-center border border-border-subtle relative overflow-hidden">
              <div class="text-[10px] text-foreground-muted uppercase tracking-wide font-semibold mb-1">Latency</div>
              <div class="flex items-center justify-center gap-1">
                <span class="text-sm font-bold text-foreground-muted">---</span>
                <span class="text-[10px] text-foreground-muted">ms</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <MatchmakingModal
      v-if="isMatchmaking"
      :status="socket.status"
      :error-message="socket.errorMessage"
      :mode="socket.mode"
      :search-progress="socket.searchProgress"
      @cancel="socket.cancelMatchmaking()"
      @retry="socket.startMatchmaking(socket.mode)"
    />

    <UpgradeAccountModal
      v-if="upgradeOpen"
      :loading="upgradeLoading"
      :server-error="upgradeError"
      @submit="handleUpgrade"
      @close="upgradeOpen = false"
    />

    <GuestLogoutDialog
      v-if="guestLogoutOpen"
      @save="openUpgrade"
      @confirm="logout"
      @cancel="guestLogoutOpen = false"
    />

    <OnlineUsersModal
      v-if="onlineModalOpen"
      @close="onlineModalOpen = false"
    />

    <LeaderboardModal
      v-if="leaderboardModalOpen"
      @close="leaderboardModalOpen = false"
    />
  </AppLayout>
</template>
