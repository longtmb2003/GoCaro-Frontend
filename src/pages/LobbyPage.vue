<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ChevronDown,
  Lock,
  LogOut,
  ShoppingBag,
  UserCircle2,
  Zap,
  MessageSquare,
  Users,
} from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDivider from '@/components/ui/BaseDivider.vue'
import BaseProgress from '@/components/ui/BaseProgress.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
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
import EditProfileModal from '@/components/EditProfileModal.vue'
import InviteModal from '@/components/InviteModal.vue'
import ActivityFeed from '@/components/ActivityFeed.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useHistoryStore } from '@/stores/history'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useLobbyStore } from '@/stores/lobby'
import { useSocketStore } from '@/stores/socket'
import { useChatStore } from '@/stores/chat'
import { useUserProfile } from '@/composables/useUserProfile'
import { useToast } from '@/composables/useToast'
import { useCountUp } from '@/composables/useCountUp'
import type { Credentials, ProfileUpdate } from '@/types/auth'

const auth = useAuthStore()
const historyStore = useHistoryStore()
const leaderboard = useLeaderboardStore()
const socket = useSocketStore()
const lobby = useLobbyStore()
const socialStore = useSocialStore()
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
const editProfileOpen = ref(false)
const editProfileLoading = ref(false)
const editProfileError = ref('')
const guestLogoutOpen = ref(false)
const leaderboardModalOpen = ref(false)
const friendsModalOpen = ref(false)
const chatDrawerOpen = ref(false)
const userMenuOpen = ref(false)
const inviteModalOpen = ref(false)
const activeInviteCode = ref('')
const heroArtworkFailed = ref(false)
const boardArtworkFailed = ref(false)
const xArtworkFailed = ref(false)
const oArtworkFailed = ref(false)

const { openProfile } = useUserProfile()

onMounted(() => {
  void leaderboard.load()
  void historyStore.load(1)
  lobby.connect()

  const savedCode = sessionStorage.getItem('gocaro_invite_code')
  if (savedCode) {
    activeInviteCode.value = savedCode
    inviteModalOpen.value = true
  }
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
    if (status !== 'idle' && inviteModalOpen.value) {
      inviteModalOpen.value = false
      activeInviteCode.value = ''
      sessionStorage.removeItem('gocaro_invite_code')
    }

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
  if (auth.isGuest) {
    openUpgrade()
    return
  }
  friendsModalOpen.value = false
  chatStore.setActiveChat(friendId)
  chatDrawerOpen.value = true
}

const totalUnreadMessages = computed(() => {
  return Object.values(chatStore.unreadCounts).reduce((a, b) => a + b, 0)
})

const totalPendingFriends = computed(() => {
  return socialStore.incomingRequests.length
})

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

function openEditProfile(): void {
  editProfileError.value = ''
  editProfileOpen.value = true
}

/**
 * Saving swaps the token as well as the user, which App.vue picks up to
 * reconnect the social socket â€” that is what makes the new name reach the
 * lobby list and lobby chat rather than only this page.
 */
async function handleEditProfile(update: ProfileUpdate): Promise<void> {
  editProfileLoading.value = true
  editProfileError.value = ''
  try {
    await auth.updateProfile(update)
    editProfileOpen.value = false
    // The board names players, so a rename makes the loaded page stale.
    void leaderboard.load()
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error
    }
    editProfileError.value = error.message
  } finally {
    editProfileLoading.value = false
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

function handleOpenOwnProfile(): void {
  if (auth.isGuest) {
    openUpgrade()
  } else if (auth.user) {
    userMenuOpen.value = false
    void openProfile(auth.user.id)
  }
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

import { createOpenChallenge } from '@/api/challenge'

async function handleCreateRoom() {
  try {
    const { code } = await createOpenChallenge()
    activeInviteCode.value = code
    sessionStorage.setItem('gocaro_invite_code', code)
    inviteModalOpen.value = true
  } catch (err: unknown) {
    if (err instanceof Error) {
      addToast(err.message || 'Failed to create room', 'error')
    } else {
      addToast('Failed to create room', 'error')
    }
  }
}

function handleCancelInvite() {
  inviteModalOpen.value = false
  activeInviteCode.value = ''
  sessionStorage.removeItem('gocaro_invite_code')
}

function handleJoinCode(code: string) {
  void router.push(`/join/${code}`)
}
</script>

<template>
  <AppLayout title="GoCaro" fantasy @upgrade="openUpgrade">
    <template #actions>
      <BaseButton
        variant="secondary"
        class="lobby-header-icon relative"
        aria-label="Friends"
        title="Friends"
        @click="!auth.isGuest ? (friendsModalOpen = true) : openUpgrade()"
      >
        <div class="flex items-center gap-1.5">
          <FantasySystemIcon v-if="auth.isGuest" compact>
            <Lock :size="14" class="text-white/50" />
          </FantasySystemIcon>
          <FantasySystemIcon compact><Users :size="18" /></FantasySystemIcon>
          <span class="utility-action-label">Friends</span>
        </div>
        <span
          v-if="totalPendingFriends > 0"
          class="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-error border border-background shadow-sm"
        />
      </BaseButton>
      <BaseButton
        variant="secondary"
        class="lobby-header-icon relative"
        aria-label="Chat"
        title="Chat"
        @click="!auth.isGuest ? (chatDrawerOpen = true) : openUpgrade()"
      >
        <div class="flex items-center gap-1.5">
          <FantasySystemIcon v-if="auth.isGuest" compact>
            <Lock :size="14" class="text-white/50" />
          </FantasySystemIcon>
          <FantasySystemIcon compact><MessageSquare :size="18" /></FantasySystemIcon>
          <span class="utility-action-label">Chat</span>
        </div>
        <span
          v-if="totalUnreadMessages > 0"
          class="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-error border border-background shadow-sm"
        />
      </BaseButton>

      <div v-if="auth.user" class="relative ml-2">
        <div v-if="userMenuOpen" class="fixed inset-0 z-40" @click="userMenuOpen = false" />
        <button
          class="lobby-user-button"
          type="button"
          :aria-expanded="userMenuOpen"
          aria-haspopup="menu"
          @click="userMenuOpen = !userMenuOpen"
        >
          <FantasySystemIcon compact><UserCircle2 :size="18" /></FantasySystemIcon>
          <span class="user-name">{{ auth.displayName }}</span>
          <FantasySystemIcon compact>
            <ChevronDown
              :size="14"
              class="opacity-70 transition-transform duration-200"
              :class="{ 'rotate-180': userMenuOpen }"
            />
          </FantasySystemIcon>
        </button>
        <div v-show="userMenuOpen" class="lobby-user-menu" role="menu">
          <button
            type="button"
            class="lobby-user-menu__account"
            role="menuitem"
            @click="handleOpenOwnProfile"
          >
            <span>Account</span>
            <strong>{{ auth.displayName }}</strong>
          </button>
          <button
            type="button"
            class="lobby-user-menu__logout"
            role="menuitem"
            @click="handleLogout"
          >
            <FantasySystemIcon compact><LogOut :size="16" /></FantasySystemIcon> Log out
          </button>
        </div>
      </div>
    </template>

    <div class="lobby-page">
      <div class="lobby-grid">
        <aside class="profile-rail" aria-label="Player overview">
          <ProfileCard
            v-if="auth.user"
            :display-name="auth.displayName"
            :elo="auth.user.elo"
            :account-type="auth.user.account_type"
            :stats="auth.user.stats"
            @edit="openEditProfile"
            @upgrade="openUpgrade"
          />

          <GlassCard
            v-if="auth.isAuthenticated"
            as="section"
            title="Daily Missions"
            class="side-card side-card--missions"
          >
            <template #icon><FantasyIcon type="daily-missions" size="small" /></template>
            <div class="mission-list">
              <div class="mission-row">
                <div class="mission-row__heading">
                  <FantasyIcon type="daily-missions" size="small" />
                  <span>
                    <small class="mission-row__rarity">Daily quest · Adventurer</small>
                    <strong>Play 2 Matches</strong>
                  </span>
                </div>
                <div class="mission-row__progress">
                  <BaseProgress
                    class="flex-1"
                    tone="warning"
                    label="Play 2 Matches progress"
                    :value="
                      missionPlay2Status === 'Completed'
                        ? 100
                        : (auth.user?.stats?.daily_matches || 0) % 2 === 1
                          ? 50
                          : 0
                    "
                  />
                  <span>{{
                    missionPlay2Status === 'Completed'
                      ? '2 / 2'
                      : ((auth.user?.stats?.daily_matches || 0) % 2) + ' / 2'
                  }}</span>
                </div>
                <div class="mission-row__reward">
                  <span><i aria-hidden="true">◆</i> 50 gold</span>
                  <button type="button" disabled>
                    {{ missionPlay2Status === 'Completed' ? 'Claimed' : 'In progress' }}
                  </button>
                </div>
              </div>
              <div class="mission-row">
                <div class="mission-row__heading">
                  <FantasyIcon type="share-game" size="small" />
                  <span>
                    <small class="mission-row__rarity">Daily quest · Guild</small>
                    <strong>Share with friends</strong>
                  </span>
                </div>
                <div class="mission-row__progress">
                  <BaseProgress
                    class="flex-1"
                    tone="warning"
                    label="Share with friends progress"
                    :value="missionShareStatus === 'Completed' ? 100 : 0"
                  />
                  <span>{{ missionShareStatus === 'Completed' ? '1 / 1' : '0 / 1' }}</span>
                </div>
                <div class="mission-row__reward">
                  <span><i aria-hidden="true">◆</i> 50 gold</span>
                  <button type="button" disabled>
                    {{ missionShareStatus === 'Completed' ? 'Claimed' : 'In progress' }}
                  </button>
                </div>
              </div>
              <BaseDivider />
              <p class="mission-total">
                Treasury <strong>{{ displayCoins }}</strong>
              </p>
            </div>
          </GlassCard>

          <GlassCard as="section" title="Cosmetics Store" class="side-card side-card--store">
            <template #icon
              ><FantasySystemIcon compact
                ><ShoppingBag :size="18" aria-hidden="true" /></FantasySystemIcon
            ></template>
            <template #actions><BaseBadge variant="neutral">Soon</BaseBadge></template>
            <p class="store-copy">New avatars and profile frames are being forged.</p>
            <ul class="cosmetic-list">
              <li v-for="preview in cosmeticPreviews" :key="preview.image">
                <img :src="preview.image" :alt="preview.alt" loading="lazy" decoding="async" />
              </li>
            </ul>
          </GlassCard>
        </aside>

        <main class="hero-column">
          <section class="fantasy-hero" aria-labelledby="lobby-hero-title">
            <img
              v-if="!heroArtworkFailed"
              src="/assets/lobby/fantasy-background.webp"
              alt=""
              fetchpriority="high"
              decoding="async"
              class="fantasy-hero__art"
              @error="heroArtworkFailed = true"
            />
            <span class="fantasy-hero__vignette" aria-hidden="true" />
            <span class="fantasy-hero__ray" aria-hidden="true" />
            <span class="fantasy-hero__mist fantasy-hero__mist--one" aria-hidden="true" />
            <span class="fantasy-hero__mist fantasy-hero__mist--two" aria-hidden="true" />
            <span class="fantasy-hero__particles fantasy-hero__particles--one" aria-hidden="true" />
            <span class="fantasy-hero__particles fantasy-hero__particles--two" aria-hidden="true" />

            <div class="fantasy-hero__board-layer" aria-hidden="true">
              <img
                v-if="!boardArtworkFailed"
                src="/assets/lobby/fantasy-board.webp"
                alt=""
                width="1254"
                height="1254"
                decoding="async"
                class="fantasy-hero__board"
                @error="boardArtworkFailed = true"
              />
              <span v-else class="fantasy-hero__board-fallback" />
              <img
                v-if="!xArtworkFailed"
                src="/assets/pieces/x-silver.webp"
                alt=""
                width="1254"
                height="1254"
                decoding="async"
                class="fantasy-piece fantasy-piece--one"
                @error="xArtworkFailed = true"
              />
              <span
                v-else
                class="fantasy-piece fantasy-piece--one fantasy-piece--fallback fantasy-piece--fallback-x"
              />
              <img
                v-if="!oArtworkFailed"
                src="/assets/pieces/o-magenta.webp"
                alt=""
                width="1536"
                height="1024"
                decoding="async"
                class="fantasy-piece fantasy-piece--two"
                @error="oArtworkFailed = true"
              />
              <span
                v-else
                class="fantasy-piece fantasy-piece--two fantasy-piece--fallback fantasy-piece--fallback-o"
              />
              <img
                v-if="!xArtworkFailed"
                src="/assets/pieces/x-silver.webp"
                alt=""
                width="1254"
                height="1254"
                decoding="async"
                class="fantasy-piece fantasy-piece--three"
                @error="xArtworkFailed = true"
              />
              <span
                v-else
                class="fantasy-piece fantasy-piece--three fantasy-piece--fallback fantasy-piece--fallback-x"
              />
              <img
                v-if="!oArtworkFailed"
                src="/assets/pieces/o-magenta.webp"
                alt=""
                width="1536"
                height="1024"
                decoding="async"
                class="fantasy-piece fantasy-piece--four"
                @error="oArtworkFailed = true"
              />
              <span
                v-else
                class="fantasy-piece fantasy-piece--four fantasy-piece--fallback fantasy-piece--fallback-o"
              />
            </div>

            <div class="fantasy-hero__content">
              <div class="fantasy-hero__brand">
                <img src="/gocaro_logo.webp" alt="" width="48" height="48" />
                <h2 id="lobby-hero-title">GoCaro</h2>
              </div>
              <p class="fantasy-hero__subtitle">Claim the board. Forge your legend.</p>
              <PlayPanel
                content="matches"
                :is-guest="auth.isGuest"
                @play="socket.startMatchmaking($event)"
                @upgrade="openUpgrade"
              />
            </div>

            <div class="fantasy-hero__realm-status" aria-live="polite">
              <span :class="networkStatus.dot" aria-hidden="true" />
              {{ networkStatus.label === 'ONLINE' ? 'The realm is online' : networkStatus.label }}
            </div>
          </section>

          <section class="utility-actions" aria-label="Quick actions">
            <PlayPanel
              content="rooms"
              class="room-actions-host"
              :is-guest="auth.isGuest"
              @upgrade="openUpgrade"
              @create-room="handleCreateRoom"
              @join-code="handleJoinCode"
            />
            <RouterLink to="/history" class="launcher-link">
              <GlassCard as="div" variant="interactive" class="premium-action-card">
                <FantasyIcon type="match-history" size="large" />
                <span><strong>Match History</strong><small>Review past battles</small></span>
              </GlassCard>
            </RouterLink>
            <GlassCard
              as="button"
              type="button"
              variant="interactive"
              class="premium-action-card"
              @click="shareGame"
            >
              <FantasyIcon type="share-game" size="large" />
              <span><strong>Share Game</strong><small>Earn +50 Coins</small></span>
            </GlassCard>
          </section>

          <div class="center-info-grid">
            <GlassCard as="section" title="Recent Match" class="center-info-card">
              <template #icon><FantasyIcon type="match-history" size="small" /></template>
              <template #actions>
                <RouterLink to="/history"
                  ><BaseButton variant="ghost" size="sm">View All</BaseButton></RouterLink
                >
              </template>
              <EmptyState
                v-if="!recentMatch"
                title="No matches yet"
                description="Play your first game to see it here."
              />
              <div v-else class="recent-match">
                <div>
                  <strong
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
                  </strong>
                  <span
                    >{{ recentMatch.is_ranked ? 'Ranked' : 'Casual' }} ·
                    {{ recentMatch.total_moves }} moves</span
                  >
                </div>
                <time :datetime="recentMatch.created_at">
                  {{
                    new Date(recentMatch.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                </time>
              </div>
            </GlassCard>

            <GlassCard
              v-if="auth.isAuthenticated"
              as="section"
              :title="`Online (${lobby.onlineUsers.length.toString()})`"
              class="center-info-card"
            >
              <template #icon
                ><span class="bg-success size-2.5 rounded-pill" aria-hidden="true"
              /></template>
              <template #actions>
                <BaseButton variant="ghost" size="sm" @click="onlineModalOpen = true"
                  >View All</BaseButton
                >
              </template>
              <EmptyState
                v-if="lobby.onlineUsers.length === 0"
                title="No one online"
                description="Start a match and others will show up here."
              />
              <ul v-else class="online-player-list">
                <li v-for="user in paginatedOnlineUsers" :key="user.id">
                  <BaseAvatar :name="user.display_name" size="sm" online />
                  <span>{{ user.display_name }}</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </main>

        <aside class="info-rail" aria-label="Realm information">
          <GlassCard as="section" title="Leaderboard" class="side-card leaderboard-card">
            <template #icon><FantasyIcon type="leaderboard" size="small" /></template>
            <p v-if="leaderboard.loading" class="panel-message">Summoning heroes…</p>
            <ErrorState v-else-if="leaderboard.error" :message="leaderboard.error">
              <template #action>
                <BaseButton variant="secondary" size="sm" @click="leaderboard.load()"
                  >Retry</BaseButton
                >
              </template>
            </ErrorState>
            <div v-else class="custom-scrollbar leaderboard-scroll">
              <LeaderboardTable
                :entries="paginatedLeaderboard"
                :current-username="auth.user?.username ?? ''"
                compact
              />
              <div class="mt-4 text-center">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="!auth.isGuest ? (leaderboardModalOpen = true) : openUpgrade()"
                >
                  <FantasySystemIcon v-if="auth.isGuest" compact class="mr-1 inline-grid opacity-60">
                    <Lock :size="14" />
                  </FantasySystemIcon>
                  View all rankings
                </BaseButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard v-if="auth.isAuthenticated" as="section" class="side-card activity-card">
            <ActivityFeed />
          </GlassCard>

          <GlassCard as="section" class="side-card system-card" aria-label="System Status">
            <div class="system-status-grid">
              <div class="system-status-title">
                <FantasySystemIcon compact><Zap :size="18" aria-hidden="true" /></FantasySystemIcon>
                <strong>System</strong>
              </div>
              <div class="system-status-item">
                <div aria-live="polite">
                  <span class="status-dot" :class="networkStatus.dot" aria-hidden="true" />
                  <strong :class="networkStatus.text">{{ networkStatus.label }}</strong>
                </div>
              </div>
              <div class="system-status-item">
                <span>Latency</span>
                <strong>—</strong>
              </div>
            </div>
          </GlassCard>
        </aside>
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
    <EditProfileModal
      v-if="editProfileOpen && auth.user"
      :full-name="auth.user.full_name"
      :username="auth.user.username"
      :can-change-name="auth.canChangeFullName"
      :name-available-at="auth.fullNameChangeAvailableAt"
      :loading="editProfileLoading"
      :server-error="editProfileError"
      @submit="handleEditProfile"
      @close="editProfileOpen = false"
    />
    <GuestLogoutDialog
      v-if="guestLogoutOpen"
      @save="openUpgrade"
      @confirm="logout"
      @cancel="guestLogoutOpen = false"
    />
    <OnlineUsersModal v-if="onlineModalOpen" @close="onlineModalOpen = false" />
    <LeaderboardModal v-if="leaderboardModalOpen" @close="leaderboardModalOpen = false" />
    <InviteModal v-if="inviteModalOpen" :code="activeInviteCode" @cancel="handleCancelInvite" />
    <FriendsModal
      v-if="friendsModalOpen"
      @close="friendsModalOpen = false"
      @open-chat="handleOpenChat"
    />
    <ChatDrawer :open="chatDrawerOpen" @close="chatDrawerOpen = false" @upgrade="openUpgrade" />
  </AppLayout>
</template>

<style scoped>
.lobby-page {
  position: relative;
  max-width: 100rem;
  margin: 0 auto;
  animation: lobby-arrive 600ms ease-out both;
}

.lobby-page :deep(.glass-card:not([data-variant='nested'])) {
  border-color: rgb(214 181 106 / 0.36);
  background:
    repeating-linear-gradient(100deg, transparent 0 0.75rem, rgb(229 222 210 / 0.018) 0.8rem 0.85rem),
    linear-gradient(145deg, rgb(41 54 63 / 0.9), rgb(10 26 44 / 0.94));
  box-shadow:
    var(--shadow-card),
    inset 0 1px 0 rgb(229 222 210 / 0.14),
    inset 0 0 0 2px rgb(3 12 24 / 0.32),
    0 0 1.25rem rgb(86 183 255 / 0.05);
}

.lobby-page :deep(.glass-card:not([data-variant='nested']))::before {
  background:
    radial-gradient(circle at 18% 0%, rgb(86 183 255 / 0.12), transparent 38%),
    repeating-linear-gradient(112deg, transparent 0 1.15rem, rgb(229 222 210 / 0.018) 1.2rem 1.25rem),
    repeating-radial-gradient(circle at 82% 18%, transparent 0 1.4rem, rgb(107 227 255 / 0.015) 1.45rem 1.5rem);
  opacity: 0.58;
}

.lobby-page :deep(.glass-card:not([data-variant='nested']))::after {
  position: absolute;
  inset: 0.3rem;
  z-index: 0;
  border: 1px solid rgb(229 222 210 / 0.06);
  border-radius: calc(var(--radius-card) - 0.3rem);
  background:
    linear-gradient(135deg, rgb(214 181 106 / 0.8) 0 0.18rem, rgb(69 47 21 / 0.82) 0.2rem 0.32rem, transparent 0.34rem) top left / 1.35rem 1.35rem no-repeat,
    linear-gradient(225deg, rgb(214 181 106 / 0.8) 0 0.18rem, rgb(69 47 21 / 0.82) 0.2rem 0.32rem, transparent 0.34rem) top right / 1.35rem 1.35rem no-repeat,
    linear-gradient(45deg, rgb(214 181 106 / 0.72) 0 0.18rem, rgb(69 47 21 / 0.76) 0.2rem 0.32rem, transparent 0.34rem) bottom left / 1.35rem 1.35rem no-repeat,
    linear-gradient(315deg, rgb(214 181 106 / 0.72) 0 0.18rem, rgb(69 47 21 / 0.76) 0.2rem 0.32rem, transparent 0.34rem) bottom right / 1.35rem 1.35rem no-repeat;
  box-shadow:
    inset 0 0 1.25rem rgb(0 5 14 / 0.22),
    inset 0 1px 0 rgb(229 222 210 / 0.04);
  content: '';
  pointer-events: none;
}

.lobby-page :deep(.glass-card:not([data-variant='nested']) > span:first-child) {
  right: 12%;
  left: 12%;
  background: linear-gradient(90deg, transparent, rgb(214 181 106 / 0.84), transparent);
}

.lobby-page :deep(.glass-card[data-variant='interactive']:hover) {
  border-color: rgb(214 181 106 / 0.7);
  box-shadow:
    var(--shadow-floating),
    0 0 1.25rem rgb(86 183 255 / 0.16),
    inset 0 1px 0 rgb(229 222 210 / 0.18),
    inset 0 0 0 2px rgb(3 12 24 / 0.3);
}

.lobby-grid {
  display: grid;
  grid-template-areas: 'profile hero info';
  grid-template-columns: minmax(12.5rem, 0.72fr) minmax(0, 2.9fr) minmax(15rem, 0.85fr);
  gap: 1.5rem;
  align-items: start;
}

.profile-rail {
  grid-area: profile;
}
.hero-column {
  grid-area: hero;
}
.info-rail {
  grid-area: info;
}

.profile-rail,
.hero-column,
.info-rail {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.5rem;
}

.fantasy-hero {
  position: relative;
  isolation: isolate;
  height: 30rem;
  min-height: 30rem;
  overflow: hidden;
  border: 1px solid rgb(214 181 106 / 0.46);
  border-radius: var(--radius-modal);
  background:
    radial-gradient(circle at 68% 34%, rgb(48 113 168 / 0.44), transparent 34%),
    linear-gradient(145deg, #122b48, var(--surface-background-secondary));
  box-shadow:
    0 1.5rem 3rem rgb(0 4 14 / 0.42),
    0 0 1.5rem rgb(86 183 255 / 0.08),
    inset 0 1px 0 rgb(229 222 210 / 0.16),
    inset 0 0 0 2px rgb(2 10 22 / 0.34);
}

.fantasy-hero::after {
  position: absolute;
  inset: 0.35rem;
  z-index: 5;
  border: 1px solid rgb(229 222 210 / 0.07);
  border-radius: calc(var(--radius-modal) - 0.35rem);
  background:
    linear-gradient(135deg, #d6b56a 0 0.22rem, #6c4821 0.24rem 0.4rem, transparent 0.42rem) top left / 1.75rem 1.75rem no-repeat,
    linear-gradient(225deg, #d6b56a 0 0.22rem, #6c4821 0.24rem 0.4rem, transparent 0.42rem) top right / 1.75rem 1.75rem no-repeat,
    linear-gradient(45deg, #b9914c 0 0.22rem, #50351d 0.24rem 0.4rem, transparent 0.42rem) bottom left / 1.75rem 1.75rem no-repeat,
    linear-gradient(315deg, #b9914c 0 0.22rem, #50351d 0.24rem 0.4rem, transparent 0.42rem) bottom right / 1.75rem 1.75rem no-repeat;
  box-shadow: inset 0 0 1.25rem rgb(0 4 14 / 0.18);
  content: '';
  pointer-events: none;
}

.fantasy-hero__art {
  position: absolute;
  inset: -1%;
  width: 102%;
  height: 102%;
  object-fit: cover;
  object-position: 53% center;
  animation: hero-camera 18s ease-in-out infinite alternate;
  will-change: transform;
}

.fantasy-hero__vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(5 12 24 / 0.86) 0%, rgb(5 12 24 / 0.48) 38%, transparent 58%),
    linear-gradient(0deg, rgb(5 12 24 / 0.24), transparent 32%),
    radial-gradient(circle at 70% 40%, transparent 20%, rgb(4 9 18 / 0.08) 100%);
}

.fantasy-hero__ray {
  position: absolute;
  top: -30%;
  right: 5%;
  width: 26%;
  height: 100%;
  opacity: 0.18;
  background: linear-gradient(90deg, transparent, rgb(255 238 188 / 0.06) 18%, rgb(255 238 188 / 0.24) 50%, rgb(255 238 188 / 0.06) 82%, transparent);
  transform: rotate(18deg);
  animation: ray-breathe 7s ease-in-out infinite;
}

.fantasy-hero__mist {
  position: absolute;
  z-index: 1;
  width: 68%;
  height: 22%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 18% 60%, rgb(229 222 210 / 0.1), transparent 28%),
    radial-gradient(ellipse at 52% 48%, rgb(196 222 239 / 0.08), transparent 34%),
    radial-gradient(ellipse at 82% 62%, rgb(107 227 255 / 0.055), transparent 26%);
  opacity: 0.34;
  pointer-events: none;
  will-change: transform, opacity;
  animation: mist-drift 18s ease-in-out infinite alternate;
}

.fantasy-hero__mist--one {
  top: 14%;
  right: -12%;
}

.fantasy-hero__mist--two {
  right: 10%;
  bottom: 12%;
  opacity: 0.2;
  animation-duration: 24s;
  animation-direction: alternate-reverse;
}

.fantasy-hero__particles {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image:
    radial-gradient(circle, rgb(255 241 184 / 0.9) 0 1px, transparent 1.5px),
    radial-gradient(circle, rgb(53 216 255 / 0.8) 0 1px, transparent 1.5px);
  background-position:
    0 0,
    2rem 3rem;
  background-size:
    5rem 5rem,
    7rem 7rem;
  animation: particles-rise 16s linear infinite;
}

.fantasy-hero__particles--two {
  opacity: 0.12;
  background-size:
    9rem 9rem,
    11rem 11rem;
  animation-duration: 24s;
  animation-direction: reverse;
}

.fantasy-hero__content {
  position: relative;
  z-index: 3;
  display: flex;
  width: min(48%, 24rem);
  height: 100%;
  flex-direction: column;
  padding: 2rem;
}

.fantasy-hero__content :deep(.play-panel) {
  margin-top: auto;
}

.fantasy-hero__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fantasy-hero__brand img {
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgb(211 168 84 / 0.5);
  border-radius: var(--radius-md);
  box-shadow: 0 0 18px rgb(211 168 84 / 0.14);
}

.fantasy-hero__brand h2 {
  color: #fffaf0;
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: clamp(2.25rem, 4vw, 3.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 18px rgb(0 0 0 / 0.72);
}

.fantasy-hero__subtitle {
  margin-top: 0.5rem;
  color: rgb(232 239 248 / 0.84);
  font-family: 'Manrope', Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: var(--text-body);
  letter-spacing: 0;
  text-shadow: 0 2px 12px rgb(0 0 0 / 0.8);
}

.fantasy-hero__board-layer {
  position: absolute;
  right: 0.75rem;
  bottom: 0.45rem;
  z-index: 2;
  width: min(56%, 27.5rem);
  aspect-ratio: 1;
  pointer-events: none;
  filter: drop-shadow(0 1.1rem 1rem rgb(2 9 20 / 0.54));
}

.fantasy-hero__board {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.fantasy-hero__board-fallback {
  position: absolute;
  inset: 13% 12% 14%;
  border: 0.35rem double rgb(219 184 112 / 0.74);
  background:
    repeating-linear-gradient(90deg, rgb(20 47 74 / 0.7) 0 1px, transparent 1px 10%),
    repeating-linear-gradient(0deg, rgb(20 47 74 / 0.7) 0 1px, transparent 1px 10%),
    rgb(211 224 230 / 0.86);
  box-shadow:
    0 0 0 0.75rem rgb(112 133 148 / 0.78),
    0 0 0 0.9rem rgb(211 168 84 / 0.62),
    0 1rem 1.2rem rgb(0 0 0 / 0.42);
}

.fantasy-piece {
  position: absolute;
  z-index: 3;
  width: 9.5%;
  height: 9.5%;
  object-fit: contain;
  filter: drop-shadow(0 0.38rem 0.18rem rgb(0 0 0 / 0.62));
}
.fantasy-piece--one {
  left: 32%;
  top: 34%;
}
.fantasy-piece--two {
  left: 49%;
  top: 40%;
  width: 11.5%;
}
.fantasy-piece--three {
  left: 43%;
  top: 53%;
}
.fantasy-piece--four {
  left: 61%;
  top: 57%;
  width: 11.5%;
}

.fantasy-piece--fallback {
  display: grid;
  place-items: center;
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(1.5rem, 3vw, 2.7rem);
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0.3rem 0.15rem rgb(0 0 0 / 0.62);
}

.fantasy-piece--fallback-x::before {
  color: #c7edf7;
  content: '×';
}

.fantasy-piece--fallback-o::before {
  color: #dd67c9;
  content: '○';
}

.fantasy-hero__realm-status {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-pill);
  background: rgb(7 17 31 / 0.7);
  -webkit-backdrop-filter: blur(var(--blur-md));
  backdrop-filter: blur(var(--blur-md));
}

.fantasy-hero__realm-status > span {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-pill);
  box-shadow: 0 0 6px currentColor;
}

.utility-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.room-actions-host {
  grid-column: span 2;
  height: 100%;
}

.room-actions-host :deep(.room-action-grid),
.room-actions-host :deep(.launcher-action) {
  height: 100%;
}
.launcher-link {
  display: block;
  min-width: 0;
  height: 100%;
}

.premium-action-card {
  display: flex;
  width: 100%;
  min-height: 5.25rem;
  height: 100%;
  align-items: center;
  gap: 1rem;
  padding: 1rem !important;
  text-align: left;
}

.premium-action-card strong,
.premium-action-card small {
  display: block;
}

.premium-action-card strong {
  color: var(--text-foreground);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-body);
  letter-spacing: 0.02em;
}

.premium-action-card small {
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: var(--text-small);
}

.center-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.center-info-card {
  min-height: 11rem;
}

.recent-match,
.online-player-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgb(214 181 106 / 0.12);
  background:
    repeating-linear-gradient(110deg, transparent 0 0.65rem, rgb(229 222 210 / 0.015) 0.7rem 0.74rem),
    linear-gradient(145deg, rgb(255 255 255 / 0.055), rgb(4 15 29 / 0.14));
  box-shadow:
    inset 0 1px 0 rgb(229 222 210 / 0.06),
    inset 0 -0.25rem 0.65rem rgb(0 4 14 / 0.12);
}

.recent-match > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recent-match strong {
  font-size: var(--text-card);
}
.recent-match span,
.recent-match time {
  color: var(--text-muted);
  font-size: var(--text-small);
}

.online-player-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.online-player-list li {
  justify-content: flex-start;
  padding: 0.5rem 0.75rem;
}

.online-player-list li > span {
  overflow: hidden;
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-card {
  border-color: rgb(214 181 106 / 0.34) !important;
  -webkit-backdrop-filter: blur(var(--blur-md)) saturate(1.06) !important;
  backdrop-filter: blur(var(--blur-md)) saturate(1.06) !important;
}

.side-card :deep(h2),
.center-info-card :deep(h2) {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-body);
  letter-spacing: 0.025em;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.7), 0 0 0.6rem rgb(86 183 255 / 0.08);
}

.lobby-page :deep(p),
.lobby-page :deep(small),
.lobby-page :deep(dd),
.lobby-page :deep(time) {
  font-family: 'Manrope', Inter, ui-sans-serif, system-ui, sans-serif;
}

.mission-list,
.mission-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mission-row {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 0.75rem;
  color: #172033;
  border: 1px solid rgb(214 181 106 / 0.54);
  border-radius: var(--radius-md);
  background:
    repeating-linear-gradient(0deg, transparent 0 0.35rem, rgb(71 51 25 / 0.035) 0.4rem 0.42rem),
    linear-gradient(100deg, rgb(229 222 210 / 0.96), rgb(205 193 170 / 0.92));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.54),
    inset 0 -0.25rem 0.7rem rgb(79 48 20 / 0.12),
    0 0.4rem 0.75rem rgb(0 0 0 / 0.18);
}

.mission-row::before,
.mission-row::after {
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  border-color: rgb(127 91 36 / 0.52);
  content: '';
  pointer-events: none;
}

.mission-row::before {
  top: 0.3rem;
  left: 0.3rem;
  border-top: 2px solid;
  border-left: 2px solid;
}

.mission-row::after {
  right: 0.3rem;
  bottom: 0.3rem;
  border-right: 2px solid;
  border-bottom: 2px solid;
}

.mission-row__heading,
.mission-row__progress,
.mission-row__reward {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: var(--text-small);
  font-weight: 700;
}

.mission-row__heading {
  justify-content: flex-start;
}

.mission-row__heading > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.mission-row__heading strong {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  line-height: 1.25;
}

.mission-row__rarity {
  color: #73572e;
  font-size: var(--text-caption);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mission-row__progress {
  color: #57472f;
}

.mission-row__progress :deep([role='progressbar']) {
  border-color: rgb(121 82 31 / 0.32);
  background: rgb(48 43 38 / 0.22);
}

.mission-row__reward {
  padding-top: 0.5rem;
  border-top: 1px solid rgb(107 74 32 / 0.2);
}

.mission-row__reward > span {
  color: #755014;
  font-size: var(--text-caption);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.mission-row__reward i {
  color: #c58a16;
  font-style: normal;
  text-shadow: 0 0 0.35rem rgb(255 199 65 / 0.46);
}

.mission-row__reward button {
  min-height: 2rem;
  padding: 0.25rem 0.6rem;
  color: #5d4928;
  font-size: var(--text-caption);
  font-weight: 800;
  border: 1px solid rgb(117 80 20 / 0.36);
  border-radius: var(--radius-sm);
  background: linear-gradient(#f3d98c, #cfa64f);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.5);
  opacity: 0.76;
}
.mission-total {
  color: var(--text-muted);
  font-size: var(--text-caption);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.mission-total strong {
  margin-left: 0.5rem;
  color: var(--color-warning);
}

.store-copy,
.panel-message {
  color: var(--text-muted);
  font-size: var(--text-small);
}

.panel-message {
  padding: 2rem 0;
  text-align: center;
}

.cosmetic-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.cosmetic-list li {
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid var(--surface-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
}

.cosmetic-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.leaderboard-scroll {
  max-height: 31rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.activity-card :deep(.activity-feed__list) {
  max-height: 10.5rem;
  overflow-y: auto;
}

.system-card {
  padding: 1rem !important;
}

.system-status-grid {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 1rem;
}

.system-status-title,
.system-status-item,
.system-status-item > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.system-status-title {
  color: var(--text-foreground);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
}

.system-status-title svg {
  color: var(--color-accent);
}

.system-status-item {
  padding-left: 1rem;
  border-left: 1px solid var(--surface-border-subtle);
}

.system-status-item > span,
.system-status-item > strong,
.system-status-item div strong {
  font-size: var(--text-small);
}

.system-status-item > span,
.system-status-item > strong {
  color: var(--text-secondary);
}
.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-pill);
}

.lobby-user-button {
  position: relative;
  z-index: 50;
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
  border: 1px solid rgb(116 201 255 / 0.14);
  border-radius: var(--radius-button);
  background: rgb(10 27 46 / 0.78);
}

.utility-action-label {
  display: none;
}

.lobby-header-icon {
  width: 2.75rem;
  padding: 0 !important;
  border-color: rgb(116 201 255 / 0.14) !important;
  background: rgb(10 27 46 / 0.78) !important;
  box-shadow: none !important;
}

.lobby-header-icon:hover {
  color: var(--color-accent);
  border-color: rgb(116 201 255 / 0.24) !important;
  transform: none !important;
}

.lobby-user-button svg:first-child {
  color: var(--color-warning);
}

.lobby-user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 50;
  width: 12rem;
  overflow: hidden;
  padding: 0.25rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-card);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-floating);
  -webkit-backdrop-filter: blur(var(--blur-glass));
  backdrop-filter: blur(var(--blur-glass));
}

.lobby-user-menu button {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  border-radius: var(--radius-md);
}
.lobby-user-menu__account span,
.lobby-user-menu__account strong {
  display: block;
}
.lobby-user-menu__account span {
  color: var(--text-muted);
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.lobby-user-menu__account strong {
  margin-top: 0.25rem;
  color: var(--text-foreground);
  font-size: var(--text-small);
}
.lobby-user-menu__logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-error);
  font-size: var(--text-small);
  font-weight: 700;
}
.lobby-user-menu button:hover {
  background: var(--surface-glass-light);
}

@keyframes lobby-arrive {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-camera {
  0% {
    transform: scale(1.015) translate3d(-0.25%, -0.25%, 0);
  }
  100% {
    transform: scale(1.055) translate3d(0.75%, 0.5%, 0);
  }
}

@keyframes ray-breathe {
  0%,
  100% {
    opacity: 0.18;
    transform: translateX(-1rem) rotate(18deg);
  }
  50% {
    opacity: 0.42;
    transform: translateX(1rem) rotate(18deg);
  }
}

@keyframes particles-rise {
  from {
    background-position:
      0 5rem,
      2rem 7rem;
  }
  to {
    background-position:
      0 -5rem,
      2rem -4rem;
  }
}

@keyframes mist-drift {
  0% {
    opacity: 0.18;
    transform: translate3d(-4%, 0, 0) scaleX(0.96);
  }
  100% {
    opacity: 0.38;
    transform: translate3d(7%, -8%, 0) scaleX(1.04);
  }
}

@media (max-width: 80rem) {
  .lobby-grid {
    grid-template-areas:
      'hero hero'
      'profile info';
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 48rem) {
  .lobby-grid {
    grid-template-areas:
      'hero'
      'profile'
      'info';
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .profile-rail,
  .hero-column,
  .info-rail {
    gap: 1rem;
  }

  .fantasy-hero {
    height: 34rem;
    min-height: 34rem;
    border-radius: var(--radius-card);
  }

  .fantasy-hero__content {
    width: 100%;
    padding: 1.5rem;
  }

  .fantasy-hero__vignette {
    background:
      linear-gradient(180deg, rgb(5 12 24 / 0.92) 0%, rgb(5 12 24 / 0.72) 58%, rgb(5 12 24 / 0.32)),
      linear-gradient(0deg, rgb(5 12 24 / 0.76), transparent 48%);
  }

  .fantasy-hero__board-layer {
    right: -1rem;
    bottom: 4.8rem;
    width: min(68%, 25rem);
    opacity: 0.96;
  }
  .utility-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .room-actions-host {
    grid-column: 1 / -1;
  }
  .center-info-grid {
    grid-template-columns: 1fr;
  }
  .user-name {
    display: none;
  }

  .system-status-grid {
    flex-wrap: wrap;
  }
}

@media (max-width: 30rem) {
  .fantasy-hero {
    height: 39rem;
    min-height: 39rem;
  }
  .fantasy-hero__board-layer {
    right: -2.5rem;
    bottom: 8.5rem;
    width: min(92%, 23rem);
  }
  .utility-actions {
    grid-template-columns: 1fr;
  }
  .room-actions-host {
    grid-column: auto;
  }
  .online-player-list {
    grid-template-columns: 1fr;
  }
  .fantasy-hero__realm-status {
    display: none;
  }
  .lobby-user-button {
    padding-inline: 0.625rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lobby-page,
  .fantasy-hero__art,
  .fantasy-hero__ray,
  .fantasy-hero__mist,
  .fantasy-hero__particles,
  .fantasy-piece {
    animation: none;
  }
}
</style>
