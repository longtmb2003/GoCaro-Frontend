<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'

const FULL_LEADERBOARD_LIMIT = 100

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    void leaderboard.load(FULL_LEADERBOARD_LIMIT, searchQuery.value)
  }, 300)
}

onMounted(() => {
  void leaderboard.load(FULL_LEADERBOARD_LIMIT, '')
})
</script>

<template>
  <AppLayout title="Leaderboard">
    <template #actions>
      <RouterLink
        to="/"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        Back to lobby
      </RouterLink>
    </template>

    <section
      class="border-border-subtle bg-surface mx-auto max-w-2xl rounded-lg border p-6 shadow-sm"
      aria-label="Leaderboard"
    >
      <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 class="text-foreground text-lg font-semibold">Top players</h2>
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by username..."
            class="border-border-subtle bg-background text-foreground focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
            @input="handleSearch"
          />
        </div>
      </div>

      <div v-if="leaderboard.loading" class="text-foreground-muted py-8 text-center text-sm">
        Loading leaderboard…
      </div>

      <div v-else-if="leaderboard.error" class="py-8 text-center">
        <p class="text-danger-400 text-sm">{{ leaderboard.error }}</p>
        <BaseButton
          variant="secondary"
          class="mt-4"
          @click="leaderboard.load(FULL_LEADERBOARD_LIMIT)"
        >
          Try again
        </BaseButton>
      </div>

      <LeaderboardTable
        v-else
        :entries="leaderboard.entries"
        :current-username="auth.user?.username ?? ''"
      />
    </section>
  </AppLayout>
</template>
