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
    (m) => m.player1_id === auth.user?.id || m.player2_id === auth.user?.id,
  )
})
</script>

<template>
  <AppLayout title="GoCaro">
    <template #actions>
      <span v-if="auth.user" class="text-white/80 hidden text-sm sm:inline font-medium">
        {{ auth.displayName }}
      </span>
      <BaseButton
        variant="secondary"
        class="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)]"
        @click="handleLogout"
        >Log out</BaseButton
      >
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Profile & Online Users -->
      <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-3">
        <div
          class="relative order-3 md:order-3 md:col-span-1 lg:order-none transform hover:-translate-y-1 transition-transform duration-300"
        >
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
          class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all duration-300 order-8 md:order-8 md:col-span-1 lg:order-none group"
          aria-label="Online Users"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-white text-sm font-bold flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"
              ></span>
              Online ({{ lobby.onlineUsers.length }})
            </h2>
            <div class="flex items-center gap-1">
              <button
                class="cursor-pointer text-xs text-primary-300 hover:text-white font-medium transition-colors bg-white/5 hover:bg-white/10 rounded-md px-2.5 py-1.5 border border-white/5"
                @click="onlineModalOpen = true"
              >
                View All
              </button>
            </div>
          </div>

          <div
            v-if="lobby.onlineUsers.length === 0"
            class="text-white/50 py-4 text-center text-xs font-medium"
          >
            No one online.
          </div>
          <div v-else class="grid grid-cols-1 gap-2.5 mt-2">
            <div
              v-for="user in paginatedOnlineUsers"
              :key="user.id"
              class="border border-white/5 rounded-xl p-2.5 flex items-center gap-3 bg-white/5 hover:bg-white/10 shadow-sm transition-all cursor-default"
            >
              <div class="relative">
                <div
                  class="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-white/10"
                >
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div
                  class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 ring-2 ring-neutral-900 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"
                ></div>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-semibold truncate text-white drop-shadow-sm">{{
                  user.username
                }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Daily Missions -->
        <section
          v-if="auth.isAuthenticated"
          class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-warning-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all duration-300 relative overflow-hidden group order-4 md:order-5 md:col-span-1 lg:order-none"
          aria-label="Daily Missions"
        >
          <div
            class="absolute -right-6 -top-6 text-7xl opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
          >
            🎯
          </div>
          <h2 class="text-white text-sm font-bold flex items-center gap-2 mb-4 relative z-10">
            <span class="text-xl">🎯</span> Daily Missions
          </h2>
          <div class="space-y-3 relative z-10">
            <div
              class="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col gap-2 shadow-inner hover:bg-white/10 transition-colors"
            >
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-white">Play 2 Matches</span>
                <span
                  class="text-[10px] text-warning-400 font-bold bg-warning-500/10 px-2 py-0.5 rounded border border-warning-500/20 shadow-sm"
                  >+50 Coins</span
                >
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="flex-1 h-2 bg-black/50 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5"
                >
                  <div
                    class="h-full bg-gradient-to-r from-warning-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-out"
                    :style="{
                      width:
                        missionPlay2Status === 'Completed'
                          ? '100%'
                          : (auth.user?.stats?.matches_played || 0) % 2 === 1
                            ? '50%'
                            : '0%',
                    }"
                  ></div>
                </div>
                <span class="text-xs font-bold text-white/70 tabular-nums">
                  {{
                    missionPlay2Status === 'Completed'
                      ? '2 / 2'
                      : ((auth.user?.stats?.matches_played || 0) % 2) + ' / 2'
                  }}
                </span>
              </div>
            </div>

            <div
              class="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col gap-2 shadow-inner hover:bg-white/10 transition-colors"
            >
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-white">Share with friends</span>
                <span
                  class="text-[10px] text-warning-400 font-bold bg-warning-500/10 px-2 py-0.5 rounded border border-warning-500/20 shadow-sm"
                  >+50 Coins</span
                >
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="flex-1 h-2 bg-black/50 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5"
                >
                  <div
                    class="h-full bg-gradient-to-r from-warning-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-out"
                    :style="{ width: missionShareStatus === 'Completed' ? '100%' : '0%' }"
                  ></div>
                </div>
                <span class="text-xs font-bold text-white/70 tabular-nums">
                  {{ missionShareStatus === 'Completed' ? '1 / 1' : '0 / 1' }}
                </span>
              </div>
            </div>

            <div class="text-center pt-3 mt-1 relative">
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent h-px top-0"
              ></div>
              <p class="text-xs text-white/60 font-semibold tracking-widest uppercase">
                TOTAL COINS:
                <span
                  class="text-warning-400 text-sm ml-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]"
                  >{{ displayCoins }}</span
                >
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Center Column: Hero & Play Panel -->
      <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-6">
        <div
          class="rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20 relative min-h-[14rem] md:h-56 group order-1 md:order-1 md:col-span-2 lg:order-none"
        >
          <img
            src="/gomoku_board.png"
            alt="GoCaro Board"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 lg:group-hover:scale-110 opacity-70 mix-blend-screen"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent z-0"
          ></div>

          <!-- Animated Light Sweep -->
          <div
            class="absolute inset-0 opacity-30 z-10 bg-gradient-to-r from-transparent via-primary-400/30 to-transparent skew-x-[-20deg] [animation:light-sweep_3s_infinite]"
          ></div>

          <!-- Decorative Floating Icons -->
          <div
            class="absolute top-6 right-8 text-3xl opacity-90 animate-float hidden sm:block"
            style="animation-duration: 4s"
          >
            ✨
          </div>
          <div
            class="absolute top-12 left-1/4 text-2xl opacity-70 animate-float hidden sm:block"
            style="animation-duration: 3s; animation-delay: 1s"
          >
            🎲
          </div>
          <div
            class="absolute bottom-8 right-1/4 text-4xl opacity-90 animate-float hidden sm:block"
            style="animation-duration: 5s; animation-delay: 2s"
          >
            🔥
          </div>

          <div
            class="absolute bottom-0 left-0 p-6 z-20 w-full bg-gradient-to-t from-black/80 to-transparent"
          >
            <h1
              class="text-4xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-3 tracking-tight"
            >
              GoCaro
              <span
                class="inline-block hover:animate-spin text-3xl cursor-default transition-all duration-300"
                >👋</span
              >
            </h1>
            <p class="text-primary-200 mt-2 text-sm font-medium drop-shadow-md">
              The ultimate online Gomoku experience.
            </p>
          </div>
        </div>

        <PlayPanel
          class="order-2 md:order-2 md:col-span-2 lg:order-none"
          :is-guest="auth.isGuest"
          @play="socket.startMatchmaking($event)"
          @upgrade="openUpgrade"
        />

        <div class="order-5 md:order-6 md:col-span-1 lg:order-none flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <RouterLink
              to="/history"
              class="cursor-pointer bg-black/40 backdrop-blur-xl hover:bg-white/10 block rounded-2xl border border-white/10 p-4 transition-all flex items-center justify-center gap-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(45,212,191,0.2)] group"
            >
              <span
                class="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-md"
                >📜</span
              >
              <span class="text-white font-semibold text-sm drop-shadow-sm">Match history</span>
            </RouterLink>

            <button
              class="cursor-pointer bg-black/40 backdrop-blur-xl hover:bg-white/10 block rounded-2xl border border-white/10 p-4 transition-all flex items-center justify-center gap-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-success-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] group relative overflow-hidden w-full"
              @click="shareGame"
            >
              <div
                class="absolute inset-0 bg-gradient-to-r from-success-500/5 to-transparent pointer-events-none"
              ></div>
              <span
                class="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-md"
                >🔗</span
              >
              <div class="flex flex-col items-start">
                <span class="text-white font-semibold text-sm leading-tight drop-shadow-sm"
                  >Share game</span
                >
                <span
                  class="text-success-400 text-[10px] font-bold uppercase tracking-wider drop-shadow-sm"
                  >+50 Coins</span
                >
              </div>
            </button>
          </div>

          <!-- Recent Match Preview -->
          <div
            class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
          >
            <div
              class="absolute -right-4 -bottom-4 text-7xl opacity-5 pointer-events-none group-hover:rotate-12 transition-transform"
            >
              ⚔️
            </div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <h3 class="text-white text-sm font-bold flex items-center gap-2">
                <span class="text-xl">⚔️</span> Recent Match
              </h3>
              <RouterLink
                to="/history"
                class="text-xs font-semibold text-primary-300 hover:text-white bg-primary-500/20 hover:bg-primary-500/40 px-2.5 py-1.5 rounded transition-colors shadow-inner"
                >View All</RouterLink
              >
            </div>

            <div
              v-if="!recentMatch"
              class="text-center py-5 bg-white/5 rounded-xl border border-white/5 shadow-inner"
            >
              <p class="text-white/50 text-xs font-medium">No matches yet. Play your first game!</p>
            </div>
            <div
              v-else
              class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 transition-all hover:bg-white/10 hover:border-primary-500/30 shadow-inner cursor-default relative z-10"
            >
              <div class="flex flex-col gap-1">
                <span
                  class="text-base font-bold drop-shadow-sm"
                  :class="
                    recentMatch.winner_id === auth.user?.id
                      ? 'text-success-400'
                      : recentMatch.winner_id
                        ? 'text-danger-400'
                        : 'text-warning-400'
                  "
                >
                  {{
                    recentMatch.winner_id === auth.user?.id
                      ? 'VICTORY'
                      : recentMatch.winner_id
                        ? 'DEFEAT'
                        : 'DRAW'
                  }}
                </span>
                <span class="text-xs text-white/60 font-medium tracking-wide">
                  <span class="text-primary-300 font-semibold">{{
                    recentMatch.is_ranked ? 'Ranked' : 'Casual'
                  }}</span>
                  • {{ recentMatch.total_moves }} Moves
                </span>
              </div>
              <div class="text-xs font-medium text-white/40 text-right">
                {{
                  new Date(recentMatch.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Shop Section -->
        <div
          class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-pink-500/30 transition-all duration-300 relative overflow-hidden order-7 md:order-7 md:col-span-2 lg:order-none group"
        >
          <div
            class="absolute -left-4 -bottom-4 text-8xl opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500"
          >
            🛍️
          </div>
          <div class="flex items-center justify-between mb-5 relative z-10">
            <h3 class="text-white text-sm font-bold flex items-center gap-2">
              <span class="text-xl drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">🛍️</span> Cosmetics Store 
            </h3>
            <span class="text-xs font-bold text-pink-300 bg-pink-500/10 px-2 py-1 rounded-md border border-pink-500/20 shadow-inner uppercase tracking-wider">Coming Soon</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <!-- Avatar Pro -->
            <div class="bg-gradient-to-b from-white/5 to-white/0 rounded-xl p-4 flex flex-col gap-3 border border-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all group/item">
              <div class="w-full aspect-square rounded-xl overflow-hidden ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover/item:scale-105 transition-transform">
                <img src="/avatar_pro.png" alt="Avatar Pro" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col justify-between flex-1 mt-1">
                <div>
                  <h4 class="text-white text-xs font-black tracking-wide drop-shadow-sm flex items-center gap-1">
                    Pro Avatar
                  </h4>
                  <p class="text-indigo-300 text-[9px] font-bold mt-0.5 uppercase tracking-wider">Cybernetics</p>
                </div>
                <button class="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-colors flex items-center justify-center gap-1.5">
                  <span class="text-warning-300 drop-shadow-md">💰</span> 500
                </button>
              </div>
            </div>

            <!-- Avatar Male -->
            <div class="bg-gradient-to-b from-white/5 to-white/0 rounded-xl p-4 flex flex-col gap-3 border border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all group/item">
              <div class="w-full aspect-square rounded-xl overflow-hidden ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover/item:scale-105 transition-transform">
                <img src="/avatar_male.png" alt="Male Avatar" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col justify-between flex-1 mt-1">
                <div>
                  <h4 class="text-white text-xs font-black tracking-wide drop-shadow-sm flex items-center gap-1">
                    Neon Boy
                  </h4>
                  <p class="text-blue-300 text-[9px] font-bold mt-0.5 uppercase tracking-wider">Cybernetics</p>
                </div>
                <button class="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-colors flex items-center justify-center gap-1.5">
                  <span class="text-warning-300 drop-shadow-md">💰</span> 300
                </button>
              </div>
            </div>

            <!-- Avatar Female -->
            <div class="bg-gradient-to-b from-white/5 to-white/0 rounded-xl p-4 flex flex-col gap-3 border border-white/10 hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all group/item">
              <div class="w-full aspect-square rounded-xl overflow-hidden ring-2 ring-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover/item:scale-105 transition-transform">
                <img src="/avatar_female.png" alt="Female Avatar" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col justify-between flex-1 mt-1">
                <div>
                  <h4 class="text-white text-xs font-black tracking-wide drop-shadow-sm flex items-center gap-1">
                    Neon Girl
                  </h4>
                  <p class="text-pink-300 text-[9px] font-bold mt-0.5 uppercase tracking-wider">Cybernetics</p>
                </div>
                <button class="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-colors flex items-center justify-center gap-1.5">
                  <span class="text-warning-300 drop-shadow-md">💰</span> 300
                </button>
              </div>
            </div>

            <!-- Avatar Robot -->
            <div class="bg-gradient-to-b from-white/5 to-white/0 rounded-xl p-4 flex flex-col gap-3 border border-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all group/item">
              <div class="w-full aspect-square rounded-xl overflow-hidden ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover/item:scale-105 transition-transform">
                <img src="/avatar_robot.png" alt="Robot Avatar" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col justify-between flex-1 mt-1">
                <div>
                  <h4 class="text-white text-xs font-black tracking-wide drop-shadow-sm flex items-center gap-1">
                    Mecha Bot
                  </h4>
                  <p class="text-emerald-300 text-[9px] font-bold mt-0.5 uppercase tracking-wider">Cybernetics</p>
                </div>
                <button class="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-colors flex items-center justify-center gap-1.5">
                  <span class="text-warning-300 drop-shadow-md">💰</span> 450
                </button>
              </div>
            </div>

            <!-- VIP Border -->
            <div class="bg-gradient-to-b from-white/5 to-white/0 rounded-xl p-4 flex flex-col gap-3 border border-white/10 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all group/item sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-center">
              <div class="w-16 h-16 shrink-0 rounded-xl overflow-hidden p-1 bg-black/50 ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover/item:scale-105 transition-transform">
                <img src="/vip_border.png" alt="VIP Border" class="w-full h-full object-contain" />
              </div>
              <div class="flex flex-col justify-between flex-1">
                <div>
                  <h4 class="text-white text-sm font-black tracking-wide drop-shadow-sm flex items-center gap-1.5">
                    VIP Border <span class="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-sm">LEGENDARY</span>
                  </h4>
                  <p class="text-white/50 text-[10px] font-semibold mt-0.5 uppercase tracking-wider">Royal Collection</p>
                </div>
                <button class="mt-2 w-full lg:w-auto px-6 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-colors flex items-center justify-center gap-1.5">
                  <span class="text-warning-100 drop-shadow-md">💰</span> 1200 Coins
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Leaderboard & Stats -->
      <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-3">
        <section
          class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-amber-500/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all duration-300 relative overflow-hidden order-6 md:order-4 md:col-span-1 lg:order-none"
          aria-label="Leaderboard"
        >
          <div class="absolute -right-10 -top-10 text-9xl opacity-5 pointer-events-none">👑</div>
          <div class="mb-4 flex items-center justify-between relative z-10">
            <h2 class="text-white text-sm font-bold flex items-center gap-2">
              <span class="text-xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">👑</span>
              Leaderboard
            </h2>
          </div>

          <div
            v-if="leaderboard.loading"
            class="text-white/50 py-8 text-center text-xs font-medium relative z-10"
          >
            Loading heroes…
          </div>

          <div v-else-if="leaderboard.error" class="py-8 text-center relative z-10">
            <p class="text-danger-400 text-xs font-medium">{{ leaderboard.error }}</p>
            <BaseButton
              variant="secondary"
              class="mt-3 text-xs py-1 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              @click="leaderboard.load()"
            >
              Retry
            </BaseButton>
          </div>

          <div
            v-else
            class="overflow-y-auto pr-1 custom-scrollbar relative z-10 max-h-48 sm:max-h-64 lg:max-h-[30rem]"
          >
            <LeaderboardTable
              :entries="paginatedLeaderboard"
              :current-username="auth.user?.username ?? ''"
              compact
            />

            <div class="mt-4 text-center">
              <button
                class="cursor-pointer inline-block text-amber-400 hover:text-amber-300 hover:underline underline-offset-4 text-xs font-bold transition-colors uppercase tracking-wider"
                @click="leaderboardModalOpen = true"
              >
                View all rankings →
              </button>
            </div>
          </div>
        </section>

        <!-- System Status -->
        <section
          class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300 order-9 md:order-9 md:col-span-1 lg:order-none"
          aria-label="System Status"
        >
          <div
            class="absolute -right-4 -bottom-4 text-7xl opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
          >
            ⚡
          </div>
          <h2 class="text-white text-sm font-bold flex items-center gap-2 mb-4 relative z-10">
            <span class="text-xl text-primary-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]"
              >⚡</span
            >
            System Status
          </h2>
          <div class="grid grid-cols-2 gap-3 relative z-10">
            <div
              class="bg-white/5 rounded-xl p-3 text-center border border-white/5 relative overflow-hidden shadow-inner"
            >
              <div class="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1.5">
                Network
              </div>
              <div class="flex items-center justify-center gap-2">
                <span
                  class="w-2 h-2 rounded-full bg-success-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse"
                ></span>
                <span class="text-xs font-black text-success-400 tracking-wide drop-shadow-sm"
                  >ONLINE</span
                >
              </div>
            </div>
            <div
              class="bg-white/5 rounded-xl p-3 text-center border border-white/5 relative overflow-hidden shadow-inner"
            >
              <div class="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1.5">
                Latency
              </div>
              <div class="flex items-center justify-center gap-1">
                <span class="text-sm font-black text-white/80 tracking-wide">---</span>
                <span class="text-[10px] text-white/40 font-bold">ms</span>
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

    <OnlineUsersModal v-if="onlineModalOpen" @close="onlineModalOpen = false" />

    <LeaderboardModal v-if="leaderboardModalOpen" @close="leaderboardModalOpen = false" />
  </AppLayout>
</template>
