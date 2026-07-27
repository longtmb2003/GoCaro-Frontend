<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
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

    <GlassCard title="Top players" class="mx-auto max-w-2xl">
      <template #icon><span aria-hidden="true">👑</span></template>
      <template #actions>
        <div class="gap-sm flex w-full items-end sm:w-auto">
          <BaseInput
            v-model="searchQuery"
            name="leaderboard-search"
            label="Search by username"
            placeholder="Search by username…"
            label-hidden
            class="w-full sm:w-64"
            @keyup.enter="handleSearch"
          />
          <BaseButton @click="handleSearch">Search</BaseButton>
        </div>
      </template>

      <p v-if="leaderboard.loading" class="text-foreground-muted py-xl text-body text-center">
        Loading leaderboard…
      </p>

      <ErrorState v-else-if="leaderboard.error" :message="leaderboard.error">
        <template #action>
          <BaseButton variant="secondary" @click="leaderboard.load(FULL_LEADERBOARD_LIMIT)">
            Try again
          </BaseButton>
        </template>
      </ErrorState>

      <template v-else>
        <LeaderboardTable
          :entries="paginatedEntries"
          :current-username="auth.user?.username ?? ''"
        />

        <div
          v-if="leaderboard.entries.length > 0"
          class="border-border-subtle mt-xl pt-lg flex items-center justify-between border-t"
        >
          <BaseButton variant="secondary" :disabled="currentPage <= 1" @click="prevPage">
            Previous
          </BaseButton>
          <span class="text-foreground-muted text-small font-semibold tabular-nums">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="currentPage >= totalPages" @click="nextPage">
            Next
          </BaseButton>
        </div>
      </template>
    </GlassCard>
  </AppLayout>
</template>
