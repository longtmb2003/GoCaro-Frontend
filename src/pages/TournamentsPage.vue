<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

const router = useRouter()
const toast = useToast()
const tournaments = useTournamentStore()
const showCreateModal = ref(false)

async function handleCreate(name: string, maxPlayers: number) {
  try {
    const id = await tournaments.create(name, maxPlayers)
    showCreateModal.value = false
    toast.addToast('Tournament created', 'success')
    router.push(`/tournaments/${id}`)
  } catch (err: any) {
    toast.addToast(err.message || 'Failed to create tournament', 'error')
  }
}

/** undefined is "all", which is why this is not a plain TournamentStatus[]. */
const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'Active Tournaments', value: 'active' },
  { label: 'Past Champions', value: 'finished' },
]

onMounted(() => {
  void tournaments.loadList(1)
})
</script>

<template>
  <AppLayout title="Tournaments">
    <template #actions>
      <RouterLink
        to="/"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        Back to lobby
      </RouterLink>
    </template>

    <GlassCard title="Tournaments" class="mx-auto max-w-4xl">
      <template #icon><Trophy :size="18" aria-hidden="true" /></template>
      <template #actions>
        <div class="flex items-center gap-4">
          <div class="gap-1 flex flex-wrap" role="group" aria-label="Filter tournaments by status">
            <BaseButton
              v-for="filter in FILTERS"
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
            Create Tournament
          </BaseButton>
        </div>
      </template>

      <p v-if="tournaments.listLoading" class="text-foreground-muted py-6 text-body text-center">
        Loading tournaments…
      </p>

      <ErrorState v-else-if="tournaments.listError" :message="tournaments.listError">
        <template #action>
          <BaseButton variant="secondary" @click="tournaments.loadList(tournaments.page)">
            Try again
          </BaseButton>
        </template>
      </ErrorState>

      <EmptyState
        v-else-if="tournaments.tournaments.length === 0"
        title="No tournaments here"
        description="Nothing matches this filter yet."
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
            Previous
          </BaseButton>
          <span class="text-foreground-muted text-small font-semibold tabular-nums">
            Page {{ tournaments.page }} of {{ tournaments.totalPages }}
          </span>
          <BaseButton
            variant="secondary"
            :disabled="!tournaments.hasNext"
            @click="tournaments.nextPage()"
          >
            Next
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
