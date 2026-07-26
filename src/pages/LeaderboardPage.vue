<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'

const FULL_LEADERBOARD_LIMIT = 100
const PAGE_SIZE = 20

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()

const searchQuery = ref('')
const currentPage = ref(1)

function handleSearch() {
  currentPage.value = 1
  void leaderboard.load(FULL_LEADERBOARD_LIMIT, searchQuery.value)
}

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return leaderboard.entries.slice(start, start + PAGE_SIZE)
})

const totalPages = computed(() => Math.ceil(leaderboard.entries.length / PAGE_SIZE) || 1)

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
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
        <div class="relative w-full sm:w-auto flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by username..."
            class="border-border-subtle bg-background text-foreground focus:border-primary-500 focus:ring-primary-500/20 w-full sm:w-64 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
            @keyup.enter="handleSearch"
          />
          <BaseButton @click="handleSearch">Search</BaseButton>
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

      <template v-else>
        <LeaderboardTable
          :entries="paginatedEntries"
          :current-username="auth.user?.username ?? ''"
        />

        <div
          v-if="leaderboard.entries.length > 0"
          class="border-border-subtle mt-4 flex items-center justify-between border-t pt-4"
        >
          <BaseButton variant="secondary" :disabled="currentPage <= 1" @click="prevPage">
            Previous
          </BaseButton>
          <span class="text-foreground-muted text-sm tabular-nums">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="currentPage >= totalPages" @click="nextPage">
            Next
          </BaseButton>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
