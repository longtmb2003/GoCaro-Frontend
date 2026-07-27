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
      class="bg-black/40 backdrop-blur-2xl mx-auto max-w-2xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden group"
      aria-label="Leaderboard"
    >
      <div class="absolute -right-10 -top-10 text-9xl opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">👑</div>
      
      <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <h2 class="text-white text-xl font-extrabold flex items-center gap-2">
          <span class="text-2xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">👑</span> Top players
        </h2>
        <div class="relative w-full sm:w-auto flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by username..."
            class="border-white/10 bg-white/5 backdrop-blur-md text-white focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/50 shadow-inner w-full sm:w-64 rounded-xl border px-4 h-10 text-sm transition-all placeholder:text-white/30"
            @keyup.enter="handleSearch"
          />
          <BaseButton @click="handleSearch">Search</BaseButton>
        </div>
      </div>

      <div v-if="leaderboard.loading" class="text-white/50 py-8 text-center text-sm font-medium relative z-10">
        Loading leaderboard…
      </div>

      <div v-else-if="leaderboard.error" class="py-8 text-center relative z-10">
        <p class="text-danger-400 text-sm font-medium">{{ leaderboard.error }}</p>
        <BaseButton
          variant="secondary"
          class="mt-4 border-white/10 bg-white/5 hover:bg-white/10 text-white"
          @click="leaderboard.load(FULL_LEADERBOARD_LIMIT)"
        >
          Try again
        </BaseButton>
      </div>

      <template v-else>
        <div class="relative z-10">
          <LeaderboardTable
            :entries="paginatedEntries"
            :current-username="auth.user?.username ?? ''"
          />
        </div>

        <div
          v-if="leaderboard.entries.length > 0"
          class="border-white/10 mt-6 flex items-center justify-between border-t pt-4 relative z-10"
        >
          <BaseButton variant="secondary" :disabled="currentPage <= 1" class="border-white/20 bg-white/5 hover:bg-white/10 text-white" @click="prevPage">
            Previous
          </BaseButton>
          <span class="text-white/60 font-semibold tracking-wide text-sm tabular-nums">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="currentPage >= totalPages" class="border-white/20 bg-white/5 hover:bg-white/10 text-white" @click="nextPage">
            Next
          </BaseButton>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
