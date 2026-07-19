<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import MatchmakingModal from '@/components/MatchmakingModal.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useSocketStore } from '@/stores/socket'

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()
const socket = useSocketStore()
const router = useRouter()

onMounted(() => {
  void leaderboard.load()
})

const isMatchmaking = computed(
  () => socket.status === 'connecting' || socket.status === 'searching' || socket.status === 'error',
)

// The socket is owned by the store and outlives this page, so navigation on a
// match is driven by watching its status rather than by the message handler.
watch(
  () => socket.status,
  (status) => {
    if (status === 'matched') {
      void router.push('/game')
    }
  },
)

async function handleLogout(): Promise<void> {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <AppLayout title="GoCaro">
    <template #actions>
      <span v-if="auth.user" class="text-foreground-muted hidden text-sm sm:inline">
        {{ auth.user.username }}
      </span>
      <BaseButton variant="secondary" @click="handleLogout">Log out</BaseButton>
    </template>

    <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div class="space-y-6">
        <ProfileCard v-if="auth.user" :username="auth.user.username" :elo="auth.user.elo" />

        <section
          class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm"
          aria-label="Play"
        >
          <h2 class="text-foreground text-lg font-semibold">Ready to play?</h2>
          <p class="text-foreground-muted mt-1 text-sm">
            Find an opponent and start a ranked match.
          </p>
          <BaseButton class="mt-4 w-full" @click="socket.startMatchmaking()">Play</BaseButton>
        </section>
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
      @cancel="socket.cancelMatchmaking()"
      @retry="socket.startMatchmaking()"
    />
  </AppLayout>
</template>
