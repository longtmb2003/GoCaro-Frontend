<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import { Crown } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'

const PAGE_SIZE = 20

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()

const searchQuery = ref('')
const currentPage = ref(1)

function handleSearch() {
  currentPage.value = 1
  void leaderboard.load(1, PAGE_SIZE, searchQuery.value)
}

const startIndex = computed(() => (currentPage.value - 1) * PAGE_SIZE)

const totalPages = computed(() => Math.ceil(leaderboard.total / PAGE_SIZE) || 1)

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    void leaderboard.load(currentPage.value, PAGE_SIZE, searchQuery.value)
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    void leaderboard.load(currentPage.value, PAGE_SIZE, searchQuery.value)
  }
}

onMounted(() => {
  void leaderboard.load(1, PAGE_SIZE, '')
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
      <template #icon><Crown :size="18" aria-hidden="true" /></template>
      <template #actions>
        <div class="gap-2 flex w-full items-end sm:w-auto">
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

      <p v-if="leaderboard.loading" class="text-foreground-muted py-6 text-body text-center">
        Loading leaderboard…
      </p>

      <ErrorState v-else-if="leaderboard.error" :message="leaderboard.error">
        <template #action>
          <BaseButton variant="secondary" @click="leaderboard.load(currentPage, PAGE_SIZE, searchQuery)">
            Try again
          </BaseButton>
        </template>
      </ErrorState>

      <template v-else>
        <LeaderboardTable
          :entries="leaderboard.entries"
          :current-username="auth.user?.username ?? ''"
          :start-index="startIndex"
        />

        <div
          v-if="leaderboard.entries.length > 0"
          class="border-border-subtle mt-6 pt-4 flex items-center justify-between border-t"
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
