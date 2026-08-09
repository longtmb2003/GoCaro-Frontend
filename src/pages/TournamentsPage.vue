<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Trophy } from 'lucide-vue-next'

import { useToast } from '@/composables/useToast'

import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import CreateTournamentModal from '@/components/CreateTournamentModal.vue'
import TournamentCard from '@/components/TournamentCard.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useTournamentStore } from '@/stores/tournament'
import { useAppLanguage } from '@/composables/useAppLanguage'

const router = useRouter()
const toast = useToast()
const tournaments = useTournamentStore()
const showCreateModal = ref(false)
const { t } = useAppLanguage()

async function handleCreate(name: string, maxPlayers: number) {
  try {
    const id = await tournaments.create(name, maxPlayers)
    showCreateModal.value = false
    toast.addToast(t('Tournament created', 'Đã tạo giải đấu'), 'success')
    await router.push(`/tournaments/${id}`)
  } catch (error: unknown) {
    const fallback = t('Failed to create tournament', 'Không thể tạo giải đấu')
    toast.addToast(error instanceof Error ? error.message : fallback, 'error')
  }
}

/** undefined is "all", which is why this is not a plain TournamentStatus[]. */
const filters = computed(() => [
  { label: t('Active Tournaments', 'Giải đang hoạt động'), value: 'active' },
  { label: t('Past Champions', 'Nhà vô địch trước đây'), value: 'finished' },
])

onMounted(() => {
  void tournaments.loadList(1)
})
</script>

<template>
  <AppLayout title="Tournaments" fantasy>
    <template #actions>
      <RouterLink
        to="/"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        {{ t('Back to lobby', 'Về sảnh') }}
      </RouterLink>
    </template>

    <GlassCard :title="t('Tournaments', 'Giải đấu')" class="mx-auto max-w-4xl">
      <template #icon><Trophy :size="18" aria-hidden="true" /></template>
      <template #actions>
        <div class="flex items-center gap-4">
          <div class="gap-1 flex flex-wrap" role="group" :aria-label="t('Filter tournaments by status', 'Lọc giải đấu theo trạng thái')">
            <BaseButton
              v-for="filter in filters"
              :key="filter.label"
              size="sm"
              :variant="tournaments.statusFilter === filter.value ? 'primary' : 'ghost'"
              :aria-pressed="tournaments.statusFilter === filter.value"
              @click="tournaments.filterBy(filter.value)"
            >
              {{ filter.label }}
            </BaseButton>
          </div>
          <BaseButton variant="primary" size="sm" @click="showCreateModal = true">
            {{ t('Create Tournament', 'Tạo giải đấu') }}
          </BaseButton>
        </div>
      </template>

      <p v-if="tournaments.listLoading" class="text-foreground-muted py-6 text-body text-center">
        {{ t('Loading tournaments…', 'Đang tải giải đấu…') }}
      </p>

      <ErrorState v-else-if="tournaments.listError" :message="tournaments.listError">
        <template #action>
          <BaseButton variant="secondary" @click="tournaments.loadList(tournaments.page)">
            {{ t('Try again', 'Thử lại') }}
          </BaseButton>
        </template>
      </ErrorState>

      <EmptyState
        v-else-if="tournaments.tournaments.length === 0"
        :title="t('No tournaments here', 'Chưa có giải đấu')"
        :description="t('Nothing matches this filter yet.', 'Chưa có nội dung phù hợp với bộ lọc này.')"
      />

      <template v-else>
        <ul class="gap-4 grid sm:grid-cols-2">
          <li v-for="tournament in tournaments.tournaments" :key="tournament.id">
            <TournamentCard :tournament="tournament" />
          </li>
        </ul>

        <div
          v-if="tournaments.total > 0"
          class="border-border-subtle mt-6 pt-4 flex items-center justify-between border-t"
        >
          <BaseButton
            variant="secondary"
            :disabled="!tournaments.hasPrev"
            @click="tournaments.prevPage()"
          >
            {{ t('Previous', 'Trước') }}
          </BaseButton>
          <span class="text-foreground-muted text-small font-semibold tabular-nums">
            {{ t('Page', 'Trang') }} {{ tournaments.page }} {{ t('of', 'trên') }} {{ tournaments.totalPages }}
          </span>
          <BaseButton
            variant="secondary"
            :disabled="!tournaments.hasNext"
            @click="tournaments.nextPage()"
          >
            {{ t('Next', 'Tiếp') }}
          </BaseButton>
        </div>
      </template>
    </GlassCard>

    <CreateTournamentModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @submit="handleCreate"
    />
  </AppLayout>
</template>
