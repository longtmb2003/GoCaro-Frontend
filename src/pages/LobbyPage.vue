<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Crown, Hand, Link2, Scroll, ShoppingBag, Swords, Target, Zap } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDivider from '@/components/ui/BaseDivider.vue'
import BaseProgress from '@/components/ui/BaseProgress.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import GuestLogoutDialog from '@/components/GuestLogoutDialog.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import LeaderboardModal from '@/components/LeaderboardModal.vue'
import MatchmakingModal from '@/components/MatchmakingModal.vue'
import PlayPanel from '@/components/PlayPanel.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import OnlineUsersModal from '@/components/OnlineUsersModal.vue'
import FriendsModal from '@/components/FriendsModal.vue'
import ChatDrawer from '@/components/ChatDrawer.vue'
import UpgradeAccountModal from '@/components/UpgradeAccountModal.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useLobbyStore } from '@/stores/lobby'
import { useSocketStore } from '@/stores/socket'
import { useChatStore } from '@/stores/chat'
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

/**
 * A preview of the cosmetics being built, not a catalogue. There is no shop, so
 * there are no prices, collections or rarities here: those would be invented
 * economy data for a feature that cannot be transacted with yet.
 */
const cosmeticPreviews = [
  { image: '/avatar_pro.webp', alt: 'Pro Avatar artwork' },
  { image: '/avatar_male.webp', alt: 'Neon Boy avatar artwork' },
  { image: '/avatar_female.webp', alt: 'Neon Girl avatar artwork' },
  { image: '/avatar_robot.webp', alt: 'Mecha Bot avatar artwork' },
  { image: '/vip_border.webp', alt: 'VIP Border artwork' },
]

const upgradeOpen = ref(false)
const upgradeLoading = ref(false)
const upgradeError = ref('')
const guestLogoutOpen = ref(false)
const leaderboardModalOpen = ref(false)
const friendsModalOpen = ref(false)
const chatDrawerOpen = ref(false)

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

/** Presentation for the real lobby socket state, using the status tokens. */
const NETWORK_STATUS = {
  online: { label: 'ONLINE', dot: 'bg-success', text: 'text-success' },
  connecting: { label: 'CONNECTING', dot: 'bg-warning', text: 'text-warning' },
  offline: { label: 'OFFLINE', dot: 'bg-error', text: 'text-error' },
} as const

const networkStatus = computed(() => NETWORK_STATUS[lobby.connectionState])

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

const chatStore = useChatStore()

function handleOpenChat(friendId: string): void {
  friendsModalOpen.value = false
  chatStore.setActiveChat(friendId)
  chatDrawerOpen.value = true
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
        v-if="auth.isAuthenticated && !auth.isGuest"
        variant="secondary"
        @click="friendsModalOpen = true"
      >
        Friends
        <span v-if="lobby.onlineUsers" class="ml-1 text-xs"></span>
      </BaseButton>
      <BaseButton
        v-if="auth.isAuthenticated"
        variant="secondary"
        @click="chatDrawerOpen = true"
      >
        Chat
      </BaseButton>
      <BaseButton
        variant="secondary"
        @click="handleLogout"
        >Log out</BaseButton
      >
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Profile, Mission, Store -->
      <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-3">
        <div class="order-3 md:order-3 md:col-span-1 lg:order-none">
          <ProfileCard
            v-if="auth.user"
            :username="auth.displayName"
            :elo="auth.user.elo"
            :account-type="auth.user.account_type"
            :stats="auth.user.stats"
          />
        </div>

        <!-- Daily Missions -->
        <GlassCard
          v-if="auth.isAuthenticated"
          as="section"
          variant="interactive"
          title="Daily Missions"
          class="order-6 md:order-5 md:col-span-1 lg:order-none"
        >
          <template #icon><Target :size="18" aria-hidden="true" /></template>

          <div class="space-y-3">
            <GlassCard as="div" variant="nested" class="gap-2 flex flex-col">
              <div class="flex items-center justify-between">
                <span class="text-small text-foreground font-semibold">Play 2 Matches</span>
                <BaseBadge variant="warning">+50 Coins</BaseBadge>
              </div>
              <div class="gap-3 flex items-center">
                <BaseProgress
                  class="flex-1"
                  tone="warning"
                  label="Play 2 Matches progress"
                  :value="
                    missionPlay2Status === 'Completed'
                      ? 100
                      : (auth.user?.stats?.matches_played || 0) % 2 === 1
                        ? 50
                        : 0
                  "
                />
                <span class="text-small text-foreground-secondary font-bold tabular-nums">
                  {{
                    missionPlay2Status === 'Completed'
                      ? '2 / 2'
                      : ((auth.user?.stats?.matches_played || 0) % 2) + ' / 2'
                  }}
                </span>
              </div>
            </GlassCard>

            <GlassCard as="div" variant="nested" class="gap-2 flex flex-col">
              <div class="flex items-center justify-between">
                <span class="text-small text-foreground font-semibold">Share with friends</span>
                <BaseBadge variant="warning">+50 Coins</BaseBadge>
              </div>
              <div class="gap-3 flex items-center">
                <BaseProgress
                  class="flex-1"
                  tone="warning"
                  label="Share with friends progress"
                  :value="missionShareStatus === 'Completed' ? 100 : 0"
                />
                <span class="text-small text-foreground-secondary font-bold tabular-nums">
                  {{ missionShareStatus === 'Completed' ? '1 / 1' : '0 / 1' }}
                </span>
              </div>
            </GlassCard>

            <BaseDivider />

            <p class="text-caption text-foreground-muted text-center tracking-widest uppercase">
              Total coins:
              <span class="text-warning text-small ml-1 font-bold">{{ displayCoins }}</span>
            </p>
          </div>
        </GlassCard>

        <!-- Store -->
        <GlassCard
          as="section"
          title="Cosmetics Store"
          class="order-7 md:order-9 md:col-span-2 lg:order-none"
        >
          <template #icon><ShoppingBag :size="18" aria-hidden="true" /></template>
          <template #actions>
            <BaseBadge variant="neutral">Coming Soon</BaseBadge>
          </template>

          <!-- A teaser, not a storefront: one honest line plus a thumbnail
               strip. max-w-xs keeps the thumbnails small when the section runs
               full width at md, so the row reads the same in both slots. -->
          <div class="gap-3 flex flex-col">
            <p class="text-small text-foreground-muted">
              Avatars and profile borders are in development.
            </p>
            <ul class="gap-2 grid grid-cols-5 max-w-xs">
              <li
                v-for="preview in cosmeticPreviews"
                :key="preview.image"
                class="bg-surface-sunken ring-border-subtle rounded-sm aspect-square overflow-hidden ring-1"
              >
                <img
                  :src="preview.image"
                  :alt="preview.alt"
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full object-cover"
                />
              </li>
            </ul>
          </div>
        </GlassCard>
      </div>

      <!-- Center Column: Hero, Play Panel, Recent Matches, Online Players -->
      <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-6">
        <!-- Hero: Illustration → Title → Description, with the Play Panel
             immediately below supplying the primary and secondary CTAs. -->
        <div
          class="hero-viewport rounded-card shadow-floating ring-border-strong relative overflow-hidden ring-1 order-1 md:order-1 md:col-span-2 lg:order-none"
        >
          <!-- Above the fold and almost certainly the LCP element: eager. -->
          <img
            src="/gomoku_board.webp"
            alt=""
            fetchpriority="high"
            decoding="async"
            class="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-screen"
          />
          <div
            class="from-background via-background/60 absolute inset-0 bg-gradient-to-t to-transparent"
          ></div>

          <!-- Light movement is the only hero motion MOTION-GUIDE.md allows. -->
          <div
            class="via-accent/30 animate-light-sweep absolute inset-0 -skew-x-20 bg-gradient-to-r from-transparent to-transparent opacity-30 motion-reduce:animate-none"
          ></div>

          <div
            class="from-background/80 p-6 absolute bottom-0 left-0 w-full bg-gradient-to-t to-transparent"
          >
            <h2 class="text-page sm:text-hero text-foreground gap-3 flex items-center tracking-tight">
              GoCaro
              <Hand :size="32" aria-hidden="true" />
            </h2>
            <p class="text-foreground-secondary text-body mt-2">
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
            <RouterLink to="/history" class="block h-full">
              <GlassCard as="div" variant="interactive" class="h-full">
                <div class="gap-3 flex h-full items-center justify-center">
                  <Scroll :size="24" aria-hidden="true" />
                  <span class="text-foreground text-body font-semibold">Match history</span>
                </div>
              </GlassCard>
            </RouterLink>

            <GlassCard
              as="button"
              type="button"
              variant="interactive"
              class="h-full w-full cursor-pointer"
              @click="shareGame"
            >
              <div class="gap-3 flex h-full items-center justify-center">
                <Link2 :size="24" aria-hidden="true" />
                <div class="flex flex-col items-start">
                  <span class="text-foreground text-body leading-tight font-semibold">
                    Share game
                  </span>
                  <span class="text-success text-caption font-bold tracking-wider uppercase">
                    +50 Coins
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          <!-- Recent Match Preview -->
          <GlassCard as="div" title="Recent Match" variant="interactive">
            <template #icon><Swords :size="18" aria-hidden="true" /></template>
            <template #actions>
              <RouterLink to="/history">
                <BaseButton variant="ghost" size="sm">View All</BaseButton>
              </RouterLink>
            </template>

            <EmptyState
              v-if="!recentMatch"
              title="No matches yet"
              description="Play your first game to see it here."
            />
            <GlassCard
              v-else
              as="div"
              variant="nested"
              class="flex items-center justify-between"
            >
              <div class="flex flex-col gap-1">
                <span
                  class="text-card"
                  :class="
                    recentMatch.winner_id === auth.user?.id
                      ? 'text-success'
                      : recentMatch.winner_id
                        ? 'text-error'
                        : 'text-warning'
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
                <span class="text-small text-foreground-muted">
                  <span class="text-accent font-semibold">{{
                    recentMatch.is_ranked ? 'Ranked' : 'Casual'
                  }}</span>
                  • {{ recentMatch.total_moves }} Moves
                </span>
              </div>
              <div class="text-small text-foreground-muted text-right">
                {{
                  new Date(recentMatch.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
              </div>
            </GlassCard>
          </GlassCard>
        </div>

        <!-- Online Players -->
        <GlassCard
          v-if="auth.isAuthenticated"
          as="section"
          variant="interactive"
          :title="`Online (${lobby.onlineUsers.length.toString()})`"
          class="order-9 md:order-8 md:col-span-1 lg:order-none"
        >
          <template #icon>
            <span class="bg-success size-2.5 rounded-pill" aria-hidden="true" />
          </template>
          <template #actions>
            <BaseButton variant="ghost" size="sm" @click="onlineModalOpen = true">
              View All
            </BaseButton>
          </template>

          <EmptyState
            v-if="lobby.onlineUsers.length === 0"
            title="No one online"
            description="Start a match and others will show up here."
          />
          <ul v-else class="gap-2 grid grid-cols-1 sm:grid-cols-2">
            <GlassCard
              v-for="user in paginatedOnlineUsers"
              :key="user.id"
              as="li"
              variant="nested"
              class="gap-3 flex items-center"
            >
              <BaseAvatar :name="user.username" size="sm" online />
              <span class="text-body text-foreground truncate font-semibold">
                {{ user.username }}
              </span>
            </GlassCard>
          </ul>
        </GlassCard>
      </div>

      <!-- Right Column: Leaderboard & Server Status -->
      <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-3">
        <GlassCard
          as="section"
          title="Leaderboard"
          variant="interactive"
          class="order-4 md:order-4 md:col-span-1 lg:order-none"
        >
          <template #icon><Crown :size="18" aria-hidden="true" /></template>

          <p v-if="leaderboard.loading" class="text-foreground-muted py-6 text-body text-center">
            Loading heroes…
          </p>

          <ErrorState v-else-if="leaderboard.error" :message="leaderboard.error">
            <template #action>
              <BaseButton variant="secondary" size="sm" @click="leaderboard.load()">
                Retry
              </BaseButton>
            </template>
          </ErrorState>

          <div
            v-else
            class="custom-scrollbar max-h-48 overflow-y-auto pr-1 sm:max-h-64 lg:max-h-120"
          >
            <LeaderboardTable
              :entries="paginatedLeaderboard"
              :current-username="auth.user?.username ?? ''"
              compact
            />

            <div class="mt-4 text-center">
              <BaseButton variant="ghost" size="sm" @click="leaderboardModalOpen = true">
                View all rankings →
              </BaseButton>
            </div>
          </div>
        </GlassCard>

        <!-- Server Status -->
        <GlassCard
          as="section"
          title="System Status"
          class="order-8 md:order-7 md:col-span-1 lg:order-none"
        >
          <template #icon><Zap :size="18" aria-hidden="true" /></template>

          <div class="grid grid-cols-2 gap-3">
            <GlassCard as="div" variant="nested" class="text-center">
              <p class="text-caption text-foreground-muted mb-2 tracking-widest uppercase">
                Network
              </p>
              <div class="gap-2 flex items-center justify-center" aria-live="polite">
                <span class="size-2 rounded-pill" :class="networkStatus.dot" aria-hidden="true" />
                <span class="text-small font-bold tracking-wide" :class="networkStatus.text">
                  {{ networkStatus.label }}
                </span>
              </div>
            </GlassCard>
            <GlassCard as="div" variant="nested" class="text-center">
              <p class="text-caption text-foreground-muted mb-2 tracking-widest uppercase">
                Latency
              </p>
              <div class="flex items-center justify-center gap-1">
                <!-- Not measured yet; say so rather than showing a placeholder
                     that reads like a value. -->
                <span class="text-small text-foreground-muted font-bold tracking-wide">
                  Unavailable
                </span>
              </div>
            </GlassCard>
          </div>
        </GlassCard>
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
    
    <FriendsModal v-if="friendsModalOpen" @close="friendsModalOpen = false" @open-chat="handleOpenChat" />
    
    <ChatDrawer 
      :open="chatDrawerOpen" 
      @close="chatDrawerOpen = false" 
      @upgrade="openUpgrade" 
    />
  </AppLayout>
</template>
