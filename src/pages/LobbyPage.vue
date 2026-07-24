<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
import { useSocketStore } from '@/stores/socket'
import type { Credentials } from '@/types/auth'

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()
const socket = useSocketStore()
const router = useRouter()

const upgradeOpen = ref(false)
const upgradeLoading = ref(false)
const upgradeError = ref('')
const guestLogoutOpen = ref(false)

onMounted(() => {
  void leaderboard.load()
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

    <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div class="space-y-6">
        <ProfileCard
          v-if="auth.user"
          :username="auth.displayName"
          :elo="auth.user.elo"
          :account-type="auth.user.account_type"
          @upgrade="openUpgrade"
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
          :entries="leaderboard.entries"
          :current-username="auth.user?.username ?? ''"
        />
      </section>
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
