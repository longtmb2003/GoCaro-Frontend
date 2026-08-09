<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAppLanguage } from '@/composables/useAppLanguage'

defineEmits<{ (e: 'close'): void }>()

const PAGE_SIZE = 10

const auth = useAuthStore()
const leaderboard = useLeaderboardStore()
const { t } = useAppLanguage()

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

onUnmounted(() => {
  if (searchQuery.value || currentPage.value > 1) {
    void leaderboard.load(1, PAGE_SIZE, '')
  }
})
</script>

<template>
  <BaseModal :title="t('Leaderboard', 'Bảng xếp hạng')" size="lg" @close="$emit('close')">
    <div class="mb-4 gap-2 flex items-end">
      <BaseInput
        v-model="searchQuery"
        name="leaderboard-modal-search"
        :label="t('Search by username', 'Tìm theo tên đăng nhập')"
        :placeholder="t('Search by username…', 'Tìm theo tên đăng nhập…')"
        label-hidden
        class="w-full"
        @keyup.enter="handleSearch"
      />
      <BaseButton @click="handleSearch">{{ t('Search', 'Tìm kiếm') }}</BaseButton>
    </div>

    <p v-if="leaderboard.loading" class="text-foreground-muted py-6 text-body text-center">
      {{ t('Loading leaderboard…', 'Đang tải bảng xếp hạng…') }}
    </p>

    <ErrorState v-else-if="leaderboard.error" :message="leaderboard.error">
      <template #action>
        <BaseButton variant="secondary" @click="leaderboard.load(currentPage, PAGE_SIZE, searchQuery)">
          {{ t('Try again', 'Thử lại') }}
        </BaseButton>
      </template>
    </ErrorState>

    <template v-else>
      <LeaderboardTable :entries="leaderboard.entries" :current-username="auth.user?.username ?? ''" compact :start-index="startIndex" />

      <div
        v-if="leaderboard.entries.length > 0"
        class="border-border-subtle mt-4 pt-4 flex items-center justify-between border-t"
      >
        <BaseButton variant="secondary" :disabled="currentPage <= 1" @click="prevPage">
          {{ t('Previous', 'Trước') }}
        </BaseButton>
        <span class="text-foreground-muted text-small tabular-nums">
          {{ t('Page', 'Trang') }} {{ currentPage }} {{ t('of', 'trên') }} {{ totalPages }}
        </span>
        <BaseButton variant="secondary" :disabled="currentPage >= totalPages" @click="nextPage">
          {{ t('Next', 'Tiếp') }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
