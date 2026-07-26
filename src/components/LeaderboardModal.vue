<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'

defineEmits<{ (e: 'close'): void }>()

const FULL_LEADERBOARD_LIMIT = 100
const PAGE_SIZE = 10

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
  <div
    class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
      aria-hidden="true"
      @click="$emit('close')"
    ></div>

    <!-- Modal panel -->
    <div class="bg-surface border-border-subtle relative w-full max-w-2xl transform overflow-hidden rounded-xl border shadow-2xl transition-all flex flex-col max-h-[85vh]">
      <div class="border-border-subtle flex items-center justify-between border-b px-6 py-4 shrink-0">
        <h2 id="modal-title" class="text-foreground text-lg font-bold flex items-center gap-2">
          <span>👑</span> Leaderboard
        </h2>
        <button
          type="button"
          class="text-foreground-muted hover:text-foreground rounded-md p-1 transition-colors"
          @click="$emit('close')"
        >
          <span class="sr-only">Close</span>
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
        <div class="mb-4 flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by username..."
            class="border-border-subtle bg-background text-foreground focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
            @keyup.enter="handleSearch"
          />
          <BaseButton @click="handleSearch">Search</BaseButton>
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
      </div>
    </div>
  </div>
</template>
