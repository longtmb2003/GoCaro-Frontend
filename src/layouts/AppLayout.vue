<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { ChevronDown, Github, Info, Lock, Mail } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import AppSettingsMenu from '@/components/AppSettingsMenu.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import RankRulesModal from '@/components/RankRulesModal.vue'
import ChallengeModal from '@/components/ChallengeModal.vue'
import OutgoingChallengeCard from '@/components/OutgoingChallengeCard.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useChatStore } from '@/stores/chat'
import LobbySocialMenu from '@/components/LobbySocialMenu.vue'
import FriendsModal from '@/components/FriendsModal.vue'
import ChatDrawer from '@/components/ChatDrawer.vue'

const HEADER_COPY = {
  en: {
    navigation: 'Primary navigation',
    lobby: 'Lobby',
    shop: 'Shop',
    collection: 'Collection',
    explore: 'Explore',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard',
    tournaments: 'Tournaments',
    history: 'History',
    rankInfo: 'Rank information',
    signInRequired: 'Sign in required',
  },
  vi: {
    navigation: 'Điều hướng chính',
    lobby: 'Sảnh',
    shop: 'Cửa hàng',
    collection: 'Bộ sưu tập',
    explore: 'Khám phá',
    achievements: 'Thành tựu',
    leaderboard: 'Xếp hạng',
    tournaments: 'Giải đấu',
    history: 'Lịch sử',
    rankInfo: 'Thông tin xếp hạng',
    signInRequired: 'Yêu cầu đăng nhập',
  },
} as const

const props = withDefaults(
  defineProps<{
    title: string
    hideFooter?: boolean
    fullBleed?: boolean
    fantasy?: boolean
  }>(),
  { hideFooter: false, fullBleed: false, fantasy: false },
)

defineEmits<{
  (e: 'upgrade'): void
}>()

const showRankRules = ref(false)
const exploreMenuOpen = ref(false)
const showFriendsModal = ref(false)
const showChatDrawer = ref(false)

const auth = useAuthStore()
const socialStore = useSocialStore()
const chatStore = useChatStore()
const appLanguage = useAppLanguage()
const headerCopy = computed(() => HEADER_COPY[appLanguage.language.value])

function handleOpenChatFromFriends(userId: string) {
  showFriendsModal.value = false
  chatStore.setActiveChat(userId)
  showChatDrawer.value = true
}

watchEffect(() => {
  if (typeof document === 'undefined') return
  document.title = props.title === 'GoCaro' ? 'GoCaro' : `${props.title} · GoCaro`
})
</script>

<template>
  <div
    class="app-layout bg-background text-foreground relative flex h-full min-h-0 flex-col overflow-hidden"
    :class="{
      'app-layout--fantasy': props.fantasy,
      'app-layout--full-bleed': props.fullBleed,
    }"
  >
    <!-- Ambient Background -->
    <div
      class="absolute inset-0 pointer-events-none mix-blend-screen opacity-20 z-0"
      style="
        background-image: url('/gocaro_bg.webp');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
      "
    ></div>

    <!-- Animated Glowing Orbs -->
    <div
      class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/30 blur-[120px] animate-pulse pointer-events-none z-0"
      style="animation-duration: 8s"
    ></div>
    <div
      class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-600/20 blur-[150px] animate-pulse pointer-events-none z-0"
      style="animation-duration: 10s; animation-delay: 2s"
    ></div>

    <!-- Header -->
    <header
      class="app-header bg-black/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-50 shrink-0"
    >
      <div
        class="app-header__inner mx-auto flex w-full max-w-7xl items-center justify-between px-4 h-16 sm:px-6"
      >
        <div class="app-header__brand flex items-center gap-6">
          <RouterLink to="/" class="flex items-center gap-2 group" aria-label="GoCaro lobby">
            <div
              class="relative w-8 h-8 rounded overflow-hidden ring-1 ring-white/20 group-hover:ring-primary-500/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-glow"
            >
              <img src="/gocaro_logo.webp" alt="GoCaro Logo" class="w-full h-full object-cover" />
            </div>
            <h1
              class="app-wordmark text-white text-xl font-black tracking-tight drop-shadow-md hidden sm:block"
            >
              GOCARO
            </h1>
          </RouterLink>

          <!-- Nav Links -->
          <nav
            :aria-label="headerCopy.navigation"
            class="hidden md:flex items-center gap-1 ml-4 bg-white/5 rounded-xl p-1 border border-white/5"
          >
            <!-- Streamlined Nav Links -->
            <RouterLink
              to="/"
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              :exact-active-class="!props.fantasy ? '!bg-primary-500 !text-white shadow-glow !border-primary-400/50' : ''"
              :aria-current="$route.path === '/' ? 'page' : undefined"
            >
              <FantasyIcon type="create-room" size="small" />
              <span>{{ headerCopy.lobby }}</span>
            </RouterLink>

            <RouterLink
              v-if="!auth.isGuest"
              to="/collection"
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              :active-class="!props.fantasy ? '!bg-primary-500 !text-white shadow-glow !border-primary-400/50' : ''"
              :aria-current="$route.path.startsWith('/collection') ? 'page' : undefined"
            >
              <FantasyIcon type="collection" size="small" />
              <span>{{ headerCopy.collection }}</span>
            </RouterLink>
            <button
              v-else
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent cursor-pointer"
              :aria-label="`${headerCopy.collection} · ${headerCopy.signInRequired}`"
              @click="$emit('upgrade')"
            >
              <span class="locked-nav-icon" aria-hidden="true">
                <FantasyIcon type="collection" size="small" />
                <Lock class="locked-nav-icon__badge" />
              </span>
              <span>{{ headerCopy.collection }}</span>
            </button>

            <RouterLink
              v-if="!auth.isGuest"
              to="/shop"
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              :active-class="!props.fantasy ? '!bg-primary-500 !text-white shadow-glow !border-primary-400/50' : ''"
              :aria-current="$route.path.startsWith('/shop') ? 'page' : undefined"
            >
              <FantasyIcon type="shop" size="small" />
              <span>{{ headerCopy.shop }}</span>
            </RouterLink>
            <button
              v-else
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent cursor-pointer"
              :aria-label="`${headerCopy.shop} · ${headerCopy.signInRequired}`"
              @click="$emit('upgrade')"
            >
              <span class="locked-nav-icon" aria-hidden="true">
                <FantasyIcon type="shop" size="small" />
                <Lock class="locked-nav-icon__badge" />
              </span>
              <span>{{ headerCopy.shop }}</span>
            </button>

            <!-- Explore Dropdown -->
            <!-- Escape lives on the wrapper, not the trigger: once focus moves
                 into a menu item the button no longer receives the key, and the
                 keyboard user loses the one way out. Events from the items
                 bubble to here. -->
            <div class="relative" @keydown.escape="exploreMenuOpen = false">
              <div v-if="exploreMenuOpen" class="fixed inset-0 z-40" @click="exploreMenuOpen = false" />
              <button
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent cursor-pointer"
                :class="{ '!text-white !bg-white/10': exploreMenuOpen || ['/leaderboard', '/tournaments', '/history', '/achievements'].some(p => $route.path.startsWith(p)) }"
                :aria-expanded="exploreMenuOpen"
                aria-haspopup="menu"
                @click="exploreMenuOpen = !exploreMenuOpen"
              >
                <FantasyIcon type="explore" size="small" />
                <span>{{ headerCopy.explore }}</span>
                <ChevronDown :size="14" class="transition-transform duration-200" :class="{ 'rotate-180': exploreMenuOpen }" />
              </button>
              <div
                v-show="exploreMenuOpen"
                class="absolute left-0 top-full mt-2 w-52 p-1.5 rounded-xl bg-slate-950/95 backdrop-blur-2xl border border-[var(--color-fantasy-border-subtle)] shadow-2xl z-50 flex flex-col gap-1"
                role="menu"
              >
                <RouterLink
                  v-if="!auth.isGuest"
                  to="/leaderboard"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                  @click="exploreMenuOpen = false"
                >
                  <FantasyIcon type="leaderboard" size="small" />
                  <span>{{ headerCopy.leaderboard }}</span>
                </RouterLink>
                <button
                  v-else
                  type="button"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/40 hover:bg-white/5 text-left transition-colors cursor-pointer"
                  role="menuitem"
                  @click="exploreMenuOpen = false; $emit('upgrade')"
                >
                  <FantasyIcon type="leaderboard" size="small" />
                  <span>{{ headerCopy.leaderboard }}</span>
                  <Lock :size="12" class="ml-auto text-amber-400" />
                </button>

                <RouterLink
                  v-if="!auth.isGuest"
                  to="/tournaments"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                  @click="exploreMenuOpen = false"
                >
                  <FantasyIcon type="tournament" size="small" />
                  <span>{{ headerCopy.tournaments }}</span>
                </RouterLink>
                <button
                  v-else
                  type="button"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/40 hover:bg-white/5 text-left transition-colors cursor-pointer"
                  role="menuitem"
                  @click="exploreMenuOpen = false; $emit('upgrade')"
                >
                  <FantasyIcon type="tournament" size="small" />
                  <span>{{ headerCopy.tournaments }}</span>
                  <Lock :size="12" class="ml-auto text-amber-400" />
                </button>

                <RouterLink
                  to="/history"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                  @click="exploreMenuOpen = false"
                >
                  <FantasyIcon type="history" size="small" />
                  <span>{{ headerCopy.history }}</span>
                </RouterLink>

                <RouterLink
                  v-if="!auth.isGuest"
                  to="/achievements"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                  @click="exploreMenuOpen = false"
                >
                  <FantasyIcon type="achievements" size="small" />
                  <span>{{ headerCopy.achievements }}</span>
                </RouterLink>
                <button
                  v-else
                  type="button"
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-white/40 hover:bg-white/5 text-left transition-colors cursor-pointer"
                  role="menuitem"
                  @click="exploreMenuOpen = false; $emit('upgrade')"
                >
                  <FantasyIcon type="achievements" size="small" />
                  <span>{{ headerCopy.achievements }}</span>
                  <Lock :size="12" class="ml-auto text-amber-400" />
                </button>
              </div>
            </div>

            <!-- Friends & Chat Nav Link -->
            <LobbySocialMenu
              :is-guest="auth.isGuest"
              :friend-requests="socialStore.incomingRequests.length"
              :unread-messages="chatStore.totalUnreadMessages"
              @friends="showFriendsModal = true"
              @chat="chatStore.setActiveChat('lobby'); showChatDrawer = true"
              @upgrade="$emit('upgrade')"
            />
          </nav>
        </div>

        <!-- Header Actions Slot -->
        <div class="app-header__actions flex items-center gap-3">
          <button
            v-if="!props.fantasy"
            type="button"
            class="header-rank-button flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-foreground-secondary hover:text-foreground"
            @click="showRankRules = true"
          >
            <Info :size="14" aria-hidden="true" />
            <span>{{ headerCopy.rankInfo }}</span>
          </button>
          <slot name="actions" />
          <AppSettingsMenu />
          <button
            v-if="props.fantasy"
            type="button"
            class="header-rank-button"
            :aria-label="headerCopy.rankInfo"
            :title="headerCopy.rankInfo"
            @click="showRankRules = true"
          >
            <FantasySystemIcon compact><Info :size="18" aria-hidden="true" /></FantasySystemIcon>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="app-main relative z-10 min-h-0 w-full flex-1"
      :class="
        props.fullBleed
          ? 'max-w-none overflow-hidden px-0 py-0'
          : 'mx-auto max-w-7xl overflow-y-auto px-4 py-6 sm:px-6'
      "
    >
      <slot />
    </main>

    <!-- Footer -->
    <footer
      v-if="!props.hideFooter"
      class="app-footer bg-black/40 border-t border-white/5 py-6 mt-auto relative z-10 shrink-0"
    >
      <div
        class="mx-auto flex w-full max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6"
      >
        <div class="flex items-center gap-2 text-xs font-mono text-foreground-muted">
          <span>GoCaro Platform</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span class="font-mono text-primary-400">v1.0.0-beta</span>
        </div>

        <div class="flex items-center gap-3 text-xs font-mono text-foreground-muted opacity-70">
          <span>Go</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span>Vue 3</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span>WebSocket</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span>PostgreSQL</span>
        </div>

        <div class="flex items-center gap-6">
          <a
            href="mailto:tranminhbaolong.forwork@gmail.com?subject=Li%C3%AAn%20h%E1%BB%87%20GoCaro&body=Ch%C3%A0o%20Long%2C%0A%0A"
            class="text-foreground-muted hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-2"
            title="tranminhbaolong.forwork@gmail.com"
          >
            <Mail :size="16" aria-hidden="true" class="shrink-0" />
            <span class="flex flex-col items-start leading-tight">
              <span>Contact</span>
              <span class="text-[10px] opacity-70 font-normal mt-0.5">tranminhbaolong.forwork@gmail.com</span>
            </span>
          </a>
          <a
            href="https://github.com/longtmb2003"
            target="_blank"
            rel="noopener noreferrer"
            class="text-foreground-muted hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Github :size="16" aria-hidden="true" />
            GitHub
          </a>
        </div>
      </div>
    </footer>

    <ToastContainer />
    <ChallengeModal />
    <OutgoingChallengeCard />
    <RankRulesModal v-if="showRankRules" @close="showRankRules = false" />
    <FriendsModal
      v-if="showFriendsModal"
      @close="showFriendsModal = false"
      @open-chat="handleOpenChatFromFriends"
    />
    <ChatDrawer :open="showChatDrawer" @close="showChatDrawer = false" @upgrade="$emit('upgrade')" />
  </div>
</template>

<style scoped>
.app-layout--fantasy {
  font-family: 'Manrope', Inter, ui-sans-serif, system-ui, sans-serif;
  background: var(--color-fantasy-navy);
  overflow-x: hidden;
  overflow-y: auto;
}

.app-layout--fantasy::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 50% 0%, rgb(61 93 151 / 0.18), transparent 42%),
    linear-gradient(180deg, transparent 70%, rgb(5 10 20 / 0.54));
  content: '';
  pointer-events: none;
}

.app-layout--fantasy .app-header {
  border-color: rgb(211 168 84 / 0.16);
  background:
    repeating-linear-gradient(90deg, transparent 0 2.9rem, rgb(214 181 106 / 0.018) 3rem 3.05rem),
    linear-gradient(180deg, rgb(10 20 34 / 0.96), rgb(5 14 27 / 0.9));
  box-shadow:
    0 12px 30px rgb(0 0 0 / 0.24),
    inset 0 1px 0 rgb(229 222 210 / 0.08),
    inset 0 -1px 0 rgb(255 255 255 / 0.025);
}

.app-layout--fantasy .app-header__inner {
  height: 3.5rem;
  max-width: 100rem;
}

.app-layout--fantasy nav {
  gap: 0.25rem;
  margin-left: 0.5rem;
  padding: 0;
  border-color: transparent;
  background: transparent;
}

.app-layout--fantasy nav :deep(a),
.app-layout--fantasy nav :deep(button) {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.35rem;
  padding-inline: 0.75rem;
  color: rgb(229 222 210 / 0.62);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  background: transparent;
}

.app-layout--fantasy nav :deep(a:not([aria-current='page']):hover),
.app-layout--fantasy nav :deep(button:hover) {
  color: var(--color-fantasy-stone);
  border-color: rgb(214 181 106 / 0.22);
  background: linear-gradient(180deg, rgb(86 183 255 / 0.08), rgb(255 255 255 / 0.025));
}

.app-layout--fantasy nav :deep(a[aria-current='page']) {
  color: var(--color-fantasy-stone) !important;
  border-color: color-mix(in srgb, var(--color-fantasy-gold) 54%, transparent) !important;
  background:
    radial-gradient(circle at 50% -80%, rgb(107 227 255 / 0.3), transparent 72%),
    linear-gradient(180deg, rgb(37 70 102 / 0.92), rgb(13 35 58 / 0.94)) !important;
  box-shadow:
    inset 0 1px 0 rgb(229 222 210 / 0.16),
    0 0 0.75rem rgb(86 183 255 / 0.14) !important;
}

.app-layout--fantasy nav :deep(a[aria-current='page'])::after {
  position: absolute;
  bottom: -0.22rem;
  left: 50%;
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid rgb(229 222 210 / 0.74);
  background: linear-gradient(135deg, #9cecff, var(--color-fantasy-blue) 52%, #244b91);
  box-shadow: 0 0 0.55rem rgb(107 227 255 / 0.62);
  content: '';
  transform: translateX(-50%) rotate(45deg);
}

/* Seven illustrated icons in a row compete with the board art behind them, so
   the bar keeps them quiet and lets the label carry the meaning. Full strength
   is reserved for the page you are on and the one under the cursor. The lobby
   is where these same destinations get advertised at full size. */
nav :deep(.fantasy-icon) {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

nav a:hover :deep(.fantasy-icon),
nav button:hover :deep(.fantasy-icon),
nav a[aria-current='page'] :deep(.fantasy-icon) {
  opacity: 1;
}

.locked-nav-icon {
  position: relative;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
}

.locked-nav-icon__badge {
  position: absolute;
  right: -0.125rem;
  bottom: -0.125rem;
  box-sizing: border-box;
  width: 1rem;
  height: 1rem;
  padding: 0.125rem;
  color: var(--color-warning);
  border: 1px solid color-mix(in srgb, var(--color-warning) 42%, var(--color-border));
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  box-shadow: 0 0 0.375rem color-mix(in srgb, var(--color-warning) 28%, transparent);
  stroke-width: 2.25;
}

.app-layout--fantasy .header-rank-button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
  padding: 0;
  place-items: center;
  color: var(--text-secondary);
  border: 1px solid rgb(116 201 255 / 0.14);
  border-radius: var(--radius-button);
  background: rgb(10 27 46 / 0.78);
  transition:
    color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    background var(--transition-duration-fast) ease-out;
}

.app-layout--fantasy .header-rank-button :deep(.fantasy-system-icon) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.app-layout--fantasy .header-rank-button:hover {
  color: var(--color-accent);
  border-color: rgb(116 201 255 / 0.24);
  background: rgb(10 27 46 / 0.88);
}

.app-layout--fantasy .app-header::after {
  position: absolute;
  right: 10%;
  bottom: -1px;
  left: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(211 168 84 / 0.38), transparent);
  content: '';
}

.app-layout--fantasy .app-wordmark {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.app-layout--fantasy .app-main {
  flex: 0 0 auto;
  max-width: none;
  padding: 1.5rem;
  overflow: visible;
}

.app-layout--fantasy.app-layout--full-bleed {
  overflow: hidden;
}

.app-layout--fantasy.app-layout--full-bleed .app-main {
  flex: 1 1 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.app-layout--fantasy .app-footer {
  margin-top: 0;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-color: rgb(211 168 84 / 0.1);
  background: rgb(5 11 23 / 0.72);
}

@media (max-width: 48rem) {
  .app-header__inner {
    gap: 0.5rem;
    padding-inline: 0.75rem;
  }

  .app-header__brand {
    min-width: 0;
    flex: 0 0 auto;
  }

  .app-header__actions {
    min-width: 0;
    gap: 0.25rem;
  }

  .app-layout--fantasy .app-main {
    padding: 1rem;
  }
}

@media (min-width: 48rem) and (max-width: 72rem) {
  .app-layout--fantasy nav :deep(.fantasy-icon) {
    display: none;
  }
}
</style>
