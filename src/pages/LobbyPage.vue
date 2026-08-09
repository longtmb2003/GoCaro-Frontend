<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ChevronDown,
  Crown,
  Lock,
  LogOut,
  UserCircle2,
  Zap,
} from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import { createOpenChallenge, validateOpenChallenge } from '@/api/challenge'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import GuestLogoutDialog from '@/components/GuestLogoutDialog.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import LeaderboardModal from '@/components/LeaderboardModal.vue'
import QuestsWidget from '@/components/QuestsWidget.vue'
import PlayPanel from '@/components/PlayPanel.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import OnlineUsersModal from '@/components/OnlineUsersModal.vue'
import FriendsModal from '@/components/FriendsModal.vue'
import ChatDrawer from '@/components/ChatDrawer.vue'
import UpgradeAccountModal from '@/components/UpgradeAccountModal.vue'
import EditProfileModal from '@/components/EditProfileModal.vue'
import InviteModal from '@/components/InviteModal.vue'
import TurnstileModal from '@/components/TurnstileModal.vue'
import ActivityFeed from '@/components/ActivityFeed.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useLobbyStore } from '@/stores/lobby'
import { useSocketStore } from '@/stores/socket'
import { useCountdown } from '@/composables/useCountdown'
import { useChatStore } from '@/stores/chat'
import { useUserProfile } from '@/composables/useUserProfile'
import { useToast } from '@/composables/useToast'
import { useMatchFoundNotification } from '@/composables/useMatchFoundNotification'
import { useShareLink } from '@/composables/useShareLink'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useShopStore } from '@/stores/shop'
import { resolveSpirit } from '@/spirits/spiritRegistry'
import type { Credentials, ProfileUpdate } from '@/types/auth'
import { openChallengeErrorMessage } from '@/utils/openChallengeError'

const auth = useAuthStore()
const historyStore = useHistoryStore()
const leaderboard = useLeaderboardStore()
const socket = useSocketStore()
const shopStore = useShopStore()

const equippedSpirit = computed(() => {
  const code = shopStore.getEquipped('spirit_art')
  if (!code) return null
  const spirit = resolveSpirit(code, null, { withArt: true })
  if (!spirit.model.source) return null
  return {
    code,
    name: spirit.name[language.value],
    source: spirit.model.source,
  }
})

// A matchmaking lockout outlives the socket session that earned it, so the play
// cards read it straight from the store rather than from a dismissed notice.
const { secondsLeft: queueLockSeconds } = useCountdown(computed(() => socket.retryUntil))
const lobby = useLobbyStore()
const { addToast } = useToast()
const router = useRouter()
const matchFoundNotification = useMatchFoundNotification()
const shareLink = useShareLink()
const { errorText, language, t } = useAppLanguage()

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
const joinRoomPending = ref(false)
const heroArtworkFailed = ref(false)
const boardArtworkFailed = ref(false)
const xArtworkFailed = ref(false)
const oArtworkFailed = ref(false)
const turnstileModalOpen = ref(false)
const pendingMatchmakingMode = ref<'casual' | 'ranked' | null>(null)

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
const networkStatus = computed(() => ({
  online: { label: t('ONLINE', 'TRỰC TUYẾN'), dot: 'bg-success', text: 'text-success' },
  connecting: { label: t('CONNECTING', 'ĐANG KẾT NỐI'), dot: 'bg-warning', text: 'text-warning' },
  offline: { label: t('OFFLINE', 'NGOẠI TUYẾN'), dot: 'bg-error', text: 'text-error' },
})[lobby.connectionState])

watch(
  () => socket.status,
  (status) => {
    if (status !== 'idle' && inviteModalOpen.value) {
      inviteModalOpen.value = false
      activeInviteCode.value = ''
      sessionStorage.removeItem('gocaro_invite_code')
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
  try {
    await shareLink.share({
      title: t('GoCaro - Play Gomoku Online', 'GoCaro - Chơi cờ Caro trực tuyến'),
      text: t('Join me for a game of Gomoku on GoCaro!', 'Chơi một ván cờ Caro cùng tôi trên GoCaro!'),
    })
  } catch {
    addToast(t('Unable to create a share link. Please try again.', 'Không thể tạo liên kết chia sẻ. Vui lòng thử lại.'), 'error')
  }
}

function handleStartMatchmaking(mode: 'casual' | 'ranked'): void {
  // Permission is requested from the Play click so browsers are allowed to
  // show the persistent alert when the tab is in the background.
  void matchFoundNotification.prepare()

  if (import.meta.env.VITE_TURNSTILE_SITE_KEY) {
    pendingMatchmakingMode.value = mode
    turnstileModalOpen.value = true
  } else {
    socket.startMatchmaking(mode)
  }
}

function onTurnstileVerified(token: string): void {
  turnstileModalOpen.value = false
  if (pendingMatchmakingMode.value) {
    socket.startMatchmaking(pendingMatchmakingMode.value, token)
    pendingMatchmakingMode.value = null
  }
}

const recentMatch = computed(() => {
  if (!auth.user) return null
  return historyStore.matches.find(
    (m) => m.player1_id === auth.user?.id || m.player2_id === auth.user?.id,
  )
})

async function handleCreateRoom() {
  try {
    const { code } = await createOpenChallenge()
    activeInviteCode.value = code
    sessionStorage.setItem('gocaro_invite_code', code)
    inviteModalOpen.value = true
  } catch (err: unknown) {
    if (err instanceof Error) {
      addToast(err.message || t('Failed to create room', 'Không thể tạo phòng'), 'error')
    } else {
      addToast(t('Failed to create room', 'Không thể tạo phòng'), 'error')
    }
  }
}

function handleCancelInvite() {
  inviteModalOpen.value = false
  activeInviteCode.value = ''
  sessionStorage.removeItem('gocaro_invite_code')
}

async function handleJoinCode(code: string): Promise<void> {
  if (joinRoomPending.value) return
  joinRoomPending.value = true

  try {
    await validateOpenChallenge(code)
    await router.push(`/join/${code}`)
  } catch (error: unknown) {
    addToast(errorText(openChallengeErrorMessage(error)), 'error')
  } finally {
    joinRoomPending.value = false
  }
}
</script>

<template>
  <AppLayout title="GoCaro" fantasy @upgrade="openUpgrade">
    <template #actions>
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
          <FantasySystemIcon compact class="user-menu-chevron">
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
            <span>{{ t('Account', 'Tài khoản') }}</span>
            <strong>{{ auth.displayName }}</strong>
          </button>
          <button
            type="button"
            class="lobby-user-menu__logout"
            role="menuitem"
            @click="handleLogout"
          >
            <FantasySystemIcon compact><LogOut :size="16" /></FantasySystemIcon>
            {{ t('Log out', 'Đăng xuất') }}
          </button>
        </div>
      </div>
    </template>

    <div class="lobby-page">
      <div class="lobby-grid">
        <aside class="profile-rail" :aria-label="t('Player overview', 'Tổng quan người chơi')">
          <ProfileCard
            v-if="auth.user"
            :display-name="auth.displayName"
            :elo="auth.user.elo"
            :account-type="auth.user.account_type"
            :stats="auth.user.stats"
            @edit="openEditProfile"
            @upgrade="openUpgrade"
          />

          <QuestsWidget />

          <RouterLink to="/shop" class="side-card side-card--store block relative" style="text-decoration: none;">
            <GlassCard as="section" :title="t('Cosmetics Store', 'Cửa hàng ngoại trang')" variant="interactive">
              <template #icon><FantasyIcon type="shop" size="small" /></template>
              <template #actions>
                <BaseButton variant="ghost" size="sm">{{ t('Enter', 'Vào cửa hàng') }}</BaseButton>
              </template>
              <p class="store-copy">{{ t('Discover new spirits and forge your legend.', 'Khám phá linh thú mới và viết nên huyền thoại.') }}</p>
            </GlassCard>
          </RouterLink>
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
              <p class="fantasy-hero__subtitle">{{ t('Claim the board. Forge your legend.', 'Làm chủ bàn cờ. Viết nên huyền thoại.') }}</p>
              <PlayPanel
                content="matches"
                :is-guest="auth.isGuest"
                :lock-seconds-left="queueLockSeconds"
                @play="handleStartMatchmaking"
                @upgrade="openUpgrade"
              />
            </div>

            <div class="fantasy-hero__realm-status" aria-live="polite">
              <span class="status-pulse-dot" :class="networkStatus.dot" aria-hidden="true" />
              <span class="realm-status__count">
                <strong class="font-mono text-white text-xs font-bold">{{ lobby.onlineUsers.length }}</strong>
                <span class="ml-1 text-xs text-white/80">{{ t('Players Online', 'Người chơi trực tuyến') }}</span>
              </span>
              <template v-if="leaderboard.entries[0]">
                <span class="realm-status__divider text-white/30" aria-hidden="true">•</span>
                <span class="realm-status__top flex items-center gap-1 text-xs text-amber-300/90 font-semibold" :title="'@' + leaderboard.entries[0].username">
                  <Crown :size="13" class="text-amber-400 shrink-0" />
                  <span>Top #1: @{{ leaderboard.entries[0].username }} ({{ leaderboard.entries[0].elo }} ELO)</span>
                </span>
              </template>
              <template v-if="equippedSpirit">
                <span class="realm-status__divider text-white/30" aria-hidden="true">•</span>
                <span class="realm-status__companion flex items-center gap-1.5 text-xs text-amber-200 font-semibold" :title="equippedSpirit.name">
                  <img :src="equippedSpirit.source" class="w-5 h-5 object-contain filter drop-shadow-md" />
                  <span>{{ t('Companion: ', 'Đồng hành: ') }}{{ equippedSpirit.name }}</span>
                </span>
              </template>
            </div>
          </section>

          <section class="utility-actions" :aria-label="t('Quick actions', 'Thao tác nhanh')">
            <PlayPanel
              content="rooms"
              class="room-actions-host"
              :is-guest="auth.isGuest"
              :join-pending="joinRoomPending"
              @upgrade="openUpgrade"
              @create-room="handleCreateRoom"
              @join-code="handleJoinCode"
            />
            <RouterLink v-if="!auth.isGuest" to="/collection" class="launcher-link">
              <GlassCard as="div" variant="interactive" class="premium-action-card">
                <FantasyIcon type="collection" size="large" />
                <span><strong>{{ t('Collection', 'Bộ sưu tập') }}</strong><small>{{ t('Track every spirit you own', 'Theo dõi linh thú đã sở hữu') }}</small></span>
              </GlassCard>
            </RouterLink>
            <RouterLink v-if="!auth.isGuest" to="/achievements" class="launcher-link">
              <GlassCard as="div" variant="interactive" class="premium-action-card">
                <FantasyIcon type="achievements" size="large" />
                <span><strong>{{ t('Achievements', 'Thành tựu') }}</strong><small>{{ t('Claim titles and frames', 'Nhận danh hiệu và khung hồ sơ') }}</small></span>
              </GlassCard>
            </RouterLink>
            <RouterLink to="/history" class="launcher-link">
              <GlassCard as="div" variant="interactive" class="premium-action-card">
                <FantasyIcon type="match-history" size="large" />
                <span><strong>{{ t('Match History', 'Lịch sử trận') }}</strong><small>{{ t('Review past battles', 'Xem lại các trận đã đấu') }}</small></span>
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
              <span><strong>{{ t('Share Game', 'Chia sẻ trò chơi') }}</strong><small>{{ t('Invite friends with link', 'Mời bạn bè bằng liên kết') }}</small></span>
            </GlassCard>
          </section>

          <div class="center-info-grid">
            <GlassCard as="section" :title="t('Recent Match', 'Trận gần đây')" class="center-info-card">
              <template #icon><FantasyIcon type="match-history" size="small" /></template>
              <template #actions>
                <RouterLink to="/history"
                  ><BaseButton variant="ghost" size="sm">{{ t('View All', 'Xem tất cả') }}</BaseButton></RouterLink
                >
              </template>
              <EmptyState
                v-if="!recentMatch"
                :title="t('No matches yet', 'Chưa có trận đấu')"
                :description="t('Play your first game to see it here.', 'Hãy chơi trận đầu tiên để xem tại đây.')"
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
                        ? t('VICTORY', 'CHIẾN THẮNG')
                        : recentMatch.winner_id
                          ? t('DEFEAT', 'THẤT BẠI')
                          : t('DRAW', 'HÒA')
                    }}
                  </strong>
                  <span
                    >{{ recentMatch.is_ranked ? t('Ranked', 'Xếp hạng') : t('Casual', 'Đấu thường') }} ·
                    {{ recentMatch.total_moves }} {{ t('moves', 'nước') }}</span
                  >
                </div>
                <time :datetime="recentMatch.created_at">
                  {{
                    new Date(recentMatch.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
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
              :title="`${t('Online', 'Trực tuyến')} (${lobby.onlineUsers.length.toString()})`"
              class="center-info-card"
            >
              <template #icon
                ><span class="bg-success size-2.5 rounded-pill" aria-hidden="true"
              /></template>
              <template #actions>
                <BaseButton variant="ghost" size="sm" @click="onlineModalOpen = true"
                  >{{ t('View All', 'Xem tất cả') }}</BaseButton
                >
              </template>
              <EmptyState
                v-if="lobby.onlineUsers.length === 0"
                :title="t('No one online', 'Chưa có ai trực tuyến')"
                :description="t('Start a match and others will show up here.', 'Bắt đầu một trận và người chơi khác sẽ xuất hiện tại đây.')"
              />
              <ul v-else class="online-player-list">
                <li v-for="user in paginatedOnlineUsers" :key="user.id">
                  <BaseAvatar :name="user.display_name" size="sm" online :class="user.profile_frame" />
                  <span class="flex items-center gap-1">
                    {{ user.display_name }}
                    <span v-if="user.title" class="text-[0.6rem] leading-tight font-bold px-1.5 py-0.25 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize whitespace-nowrap">{{ user.title.replace('title_', '').split('_').join(' ') }}</span>
                  </span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </main>

        <aside class="info-rail" :aria-label="t('Realm information', 'Thông tin máy chủ')">
          <GlassCard as="section" :title="t('Leaderboard', 'Bảng xếp hạng')" class="side-card leaderboard-card">
            <template #icon><FantasyIcon type="leaderboard" size="small" /></template>
            <p v-if="leaderboard.loading" class="panel-message">{{ t('Summoning heroes…', 'Đang tải người chơi…') }}</p>
            <ErrorState v-else-if="leaderboard.error" :message="leaderboard.error">
              <template #action>
                <BaseButton variant="secondary" size="sm" @click="leaderboard.load()"
                  >{{ t('Retry', 'Thử lại') }}</BaseButton
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
                  <FantasySystemIcon
                    v-if="auth.isGuest"
                    compact
                    class="mr-1 inline-grid opacity-60"
                  >
                    <Lock :size="14" />
                  </FantasySystemIcon>
                  {{ t('View all rankings', 'Xem toàn bộ xếp hạng') }}
                </BaseButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard v-if="auth.isAuthenticated" as="section" class="side-card activity-card">
            <ActivityFeed />
          </GlassCard>

          <GlassCard as="section" class="side-card system-card" :aria-label="t('System Status', 'Trạng thái hệ thống')">
            <div class="system-status-grid">
              <div class="system-status-title">
                <FantasySystemIcon compact><Zap :size="18" aria-hidden="true" /></FantasySystemIcon>
                <strong>{{ t('System', 'Hệ thống') }}</strong>
              </div>
              <div class="system-status-item">
                <div aria-live="polite">
                  <span class="status-dot" :class="networkStatus.dot" aria-hidden="true" />
                  <strong :class="networkStatus.text">{{ networkStatus.label }}</strong>
                </div>
              </div>
              <div class="system-status-item">
                <span>{{ t('Latency', 'Độ trễ') }}</span>
                <strong>—</strong>
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>

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
    <TurnstileModal
      v-if="turnstileModalOpen"
      @verify="onTurnstileVerified"
      @close="turnstileModalOpen = false; pendingMatchmakingMode = null"
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
  border-color: var(--color-fantasy-border-subtle);
  background:
    repeating-linear-gradient(
      100deg,
      transparent 0 0.75rem,
      rgb(229 222 210 / 0.018) 0.8rem 0.85rem
    ),
    linear-gradient(145deg, rgb(30 45 60 / 0.9), rgb(10 24 40 / 0.94));
  box-shadow:
    var(--shadow-card),
    inset 0 1px 0 rgb(229 222 210 / 0.1),
    inset 0 0 0 1px rgb(86 183 255 / 0.08),
    0 0 1.25rem rgb(86 183 255 / 0.04);
}

.lobby-page :deep(.glass-card:not([data-variant='nested']))::before {
  background:
    radial-gradient(circle at 18% 0%, rgb(86 183 255 / 0.12), transparent 38%),
    repeating-linear-gradient(
      112deg,
      transparent 0 1.15rem,
      rgb(229 222 210 / 0.018) 1.2rem 1.25rem
    ),
    repeating-radial-gradient(
      circle at 82% 18%,
      transparent 0 1.4rem,
      rgb(107 227 255 / 0.015) 1.45rem 1.5rem
    );
  opacity: 0.58;
}

.lobby-page :deep(.glass-card:not([data-variant='nested']))::after {
  position: absolute;
  inset: 0.3rem;
  z-index: 0;
  border: 1px solid rgb(229 222 210 / 0.06);
  border-radius: calc(var(--radius-card) - 0.3rem);
  background:
    linear-gradient(
        135deg,
        rgb(214 181 106 / 0.8) 0 0.18rem,
        rgb(69 47 21 / 0.82) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      top left / 1.35rem 1.35rem no-repeat,
    linear-gradient(
        225deg,
        rgb(214 181 106 / 0.8) 0 0.18rem,
        rgb(69 47 21 / 0.82) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      top right / 1.35rem 1.35rem no-repeat,
    linear-gradient(
        45deg,
        rgb(214 181 106 / 0.72) 0 0.18rem,
        rgb(69 47 21 / 0.76) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      bottom left / 1.35rem 1.35rem no-repeat,
    linear-gradient(
        315deg,
        rgb(214 181 106 / 0.72) 0 0.18rem,
        rgb(69 47 21 / 0.76) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      bottom right / 1.35rem 1.35rem no-repeat;
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
  border-color: rgb(86 183 255 / 0.45);
  box-shadow:
    var(--shadow-floating),
    0 0 1.25rem rgb(86 183 255 / 0.16),
    inset 0 1px 0 rgb(229 222 210 / 0.18);
}

/* ── Typography Visual Hierarchy ───────────────────────── */
.leaderboard-card :deep(h2) {
  font-family: 'Cinzel', Georgia, serif;
  font-size: var(--text-card);
  letter-spacing: 0.04em;
  color: var(--color-fantasy-stone);
}

.center-info-card :deep(h2),
.activity-card :deep(h2) {
  font-size: var(--text-body);
  font-weight: 700;
  letter-spacing: 0.01em;
}

.lobby-grid {
  display: grid;
  grid-template-areas: 'profile hero info';
  grid-template-columns: minmax(12.5rem, 0.72fr) minmax(0, 2.9fr) minmax(18.5rem, 1fr);
  gap: 1rem;
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
  gap: 1rem;
}

.fantasy-hero {
  position: relative;
  isolation: isolate;
  height: 24.5rem;
  min-height: 24.5rem;
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
    linear-gradient(135deg, #d6b56a 0 0.22rem, #6c4821 0.24rem 0.4rem, transparent 0.42rem) top
      left / 1.75rem 1.75rem no-repeat,
    linear-gradient(225deg, #d6b56a 0 0.22rem, #6c4821 0.24rem 0.4rem, transparent 0.42rem) top
      right / 1.75rem 1.75rem no-repeat,
    linear-gradient(45deg, #b9914c 0 0.22rem, #50351d 0.24rem 0.4rem, transparent 0.42rem) bottom
      left / 1.75rem 1.75rem no-repeat,
    linear-gradient(315deg, #b9914c 0 0.22rem, #50351d 0.24rem 0.4rem, transparent 0.42rem) bottom
      right / 1.75rem 1.75rem no-repeat;
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
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 238 188 / 0.06) 18%,
    rgb(255 238 188 / 0.24) 50%,
    rgb(255 238 188 / 0.06) 82%,
    transparent
  );
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
  width: min(54%, 26.5rem);
  height: 100%;
  flex-direction: column;
  padding: 1.25rem 1.5rem 3rem;
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
  animation: hero-board-float 7s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes hero-board-float {
  0% { transform: translateY(0px) rotate(0deg); }
  100% { transform: translateY(-7px) rotate(1.2deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fantasy-hero__board-layer {
    animation: none !important;
  }
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
  left: 1rem;
  right: 1rem;
  bottom: 0;
  z-index: 4;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.02em;
  border-top: 1px solid var(--surface-border);
  border-radius: 0 0 calc(var(--radius-modal) - 0.35rem) calc(var(--radius-modal) - 0.35rem);
  background: rgb(7 17 31 / 0.78);
  -webkit-backdrop-filter: blur(var(--blur-md));
  backdrop-filter: blur(var(--blur-md));
}

.status-pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-pill);
  box-shadow: 0 0 6px currentColor;
  animation: dot-pulse 2.5s infinite ease-in-out;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.85); }
}

@media (prefers-reduced-motion: reduce) {
  .status-pulse-dot {
    animation: none;
  }
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
    repeating-linear-gradient(
      110deg,
      transparent 0 0.65rem,
      rgb(229 222 210 / 0.015) 0.7rem 0.74rem
    ),
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
  text-shadow:
    0 1px 0 rgb(0 0 0 / 0.7),
    0 0 0.6rem rgb(86 183 255 / 0.08);
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
  color: var(--text-foreground);
  border: 1px solid color-mix(in srgb, var(--color-warning) 28%, var(--color-border));
  border-radius: var(--radius-md);
  background:
    radial-gradient(
      circle at 0 0,
      color-mix(in srgb, var(--color-warning) 9%, transparent),
      transparent 46%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--surface-2) 88%, transparent),
      color-mix(in srgb, var(--surface-sunken) 94%, transparent)
    );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--text-foreground) 8%, transparent),
    0 0.4rem 0.75rem color-mix(in srgb, var(--surface-background) 34%, transparent);
}

.mission-row::before {
  position: absolute;
  top: 0;
  right: 12%;
  left: 12%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-warning) 48%, transparent),
    transparent
  );
  content: '';
  pointer-events: none;
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
  color: var(--text-foreground);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  line-height: 1.25;
}

.mission-row__rarity {
  color: color-mix(in srgb, var(--color-warning) 82%, var(--text-secondary));
  font-size: var(--text-caption);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mission-row__progress {
  color: var(--text-muted);
}

.mission-row__progress :deep([role='progressbar']) {
  border-color: color-mix(in srgb, var(--color-warning) 20%, var(--color-border-subtle));
  background: var(--surface-sunken);
}

.mission-row__reward {
  padding-top: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--color-warning) 14%, var(--color-border-subtle));
}

.mission-row__reward > span {
  color: var(--color-warning);
  font-size: var(--text-caption);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.mission-row__reward i {
  color: var(--color-warning);
  font-style: normal;
  text-shadow: 0 0 0.35rem color-mix(in srgb, var(--color-warning) 42%, transparent);
}

.mission-row__reward button {
  min-height: 2rem;
  padding: 0.25rem 0.6rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 800;
  border: 1px solid color-mix(in srgb, var(--color-warning) 22%, var(--color-border));
  border-radius: var(--radius-sm);
  background: var(--surface-glass-light);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text-foreground) 7%, transparent);
  opacity: 0.72;
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

@media (max-width: 72rem) {
  .user-name {
    display: none;
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
    width: 2.75rem;
    padding: 0;
    justify-content: center;
  }
  .user-menu-chevron {
    display: none;
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
