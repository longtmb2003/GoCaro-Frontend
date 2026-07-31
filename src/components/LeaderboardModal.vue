<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
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
  <BaseModal title="Leaderboard" size="lg" @close="$emit('close')">
    <div class="mb-4 gap-2 flex items-end">
      <BaseInput
        v-model="searchQuery"
        name="leaderboard-modal-search"
        label="Search by username"
        placeholder="Search by username…"
        label-hidden
        class="w-full"
        @keyup.enter="handleSearch"
      />
      <BaseButton @click="handleSearch">Search</BaseButton>
    </div>

    <p v-if="leaderboard.loading" class="text-foreground-muted py-6 text-body text-center">
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
      <LeaderboardTable :entries="paginatedEntries" :current-username="auth.user?.username ?? ''" />

      <div
        v-if="leaderboard.entries.length > 0"
        class="border-border-subtle mt-4 pt-4 flex items-center justify-between border-t"
      >
        <BaseButton variant="secondary" :disabled="currentPage <= 1" @click="prevPage">
          Previous
        </BaseButton>
        <span class="text-foreground-muted text-small tabular-nums">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <BaseButton variant="secondary" :disabled="currentPage >= totalPages" @click="nextPage">
          Next
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
