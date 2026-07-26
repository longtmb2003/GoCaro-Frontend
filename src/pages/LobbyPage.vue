<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import BaseButton from '@/components/BaseButton.vue'
import GuestLogoutDialog from '@/components/GuestLogoutDialog.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import MatchmakingModal from '@/components/MatchmakingModal.vue'
import PlayPanel from '@/components/PlayPanel.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import UpgradeAccountModal from '@/components/UpgradeAccountModal.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useLobbyStore } from '@/stores/lobby'
import { useSocketStore } from '@/stores/socket'
import type { Credentials } from '@/types/auth'

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()
const socket = useSocketStore()
const lobby = useLobbyStore()
const router = useRouter()

const upgradeOpen = ref(false)
const upgradeLoading = ref(false)
const upgradeError = ref('')
const guestLogoutOpen = ref(false)

onMounted(() => {
  void leaderboard.load()
  lobby.connect()
})

onUnmounted(() => {
  lobby.disconnect()
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
</script>

<template>
  <AppLayout title="GoCaro">
    <template #actions>
      <span v-if="auth.user" class="text-foreground-muted hidden text-sm sm:inline">
        {{ auth.displayName }}
      </span>
      <BaseButton variant="secondary" @click="handleLogout">Log out</BaseButton>
    </template>

    <div class="mb-8 rounded-xl overflow-hidden shadow-lg border border-border-subtle relative h-48 sm:h-64">
      <img src="/gocaro_hero.png" alt="GoCaro Hero" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
      <div class="absolute bottom-0 left-0 p-6">
        <h1 class="text-3xl font-bold text-white drop-shadow-md">Welcome to GoCaro</h1>
        <p class="text-white/80 mt-1 drop-shadow-md">Play the classic Gomoku game with a modern twist.</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div class="space-y-6">
        <ProfileCard
          v-if="auth.user"
          :username="auth.displayName"
          :elo="auth.user.elo"
          :account-type="auth.user.account_type"
        />

        <PlayPanel
          :is-guest="auth.isGuest"
          @play="socket.startMatchmaking($event)"
          @upgrade="openUpgrade"
        />

        <RouterLink
          to="/history"
          class="border-border-subtle bg-surface hover:bg-surface-elevated block rounded-lg border p-4 text-sm font-medium transition-colors"
        >
          Match history
        </RouterLink>
      </div>

      <div class="space-y-6">
        <section
          class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm"
          aria-label="Leaderboard"
        >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-foreground text-lg font-semibold">Leaderboard</h2>
          <RouterLink
            to="/leaderboard"
            class="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            View all
          </RouterLink>
        </div>

        <div v-if="leaderboard.loading" class="text-foreground-muted py-8 text-center text-sm">
          Loading leaderboard…
        </div>

        <div v-else-if="leaderboard.error" class="py-8 text-center">
          <p class="text-danger-400 text-sm">{{ leaderboard.error }}</p>
          <BaseButton variant="secondary" class="mt-4" @click="leaderboard.load()">
            Try again
          </BaseButton>
        </div>

        <LeaderboardTable
          v-else
          :entries="leaderboard.entries.slice(0, 5)"
          :current-username="auth.user?.username ?? ''"
        />
      </section>

      <!-- Online Users Section -->
      <section
        v-if="auth.isAuthenticated"
        class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm mt-6"
        aria-label="Online Users"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-foreground text-lg font-semibold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
            Online Now ({{ lobby.onlineUsers.length }})
          </h2>
        </div>
        
        <div v-if="lobby.onlineUsers.length === 0" class="text-foreground-muted py-8 text-center text-sm">
          No other users online right now.
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div v-for="user in lobby.onlineUsers" :key="user.id" class="border border-border-subtle rounded-md p-2 flex items-center gap-2 bg-background/50">
            <div class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
              {{ user.username.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium truncate">{{ user.username }}</span>
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
  </AppLayout>
</template>
