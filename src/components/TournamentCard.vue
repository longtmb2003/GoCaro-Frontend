<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, Crown, Users } from 'lucide-vue-next'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import type { TournamentSummary } from '@/types/tournament'
import { statusPresentation } from '@/utils/tournament'

const props = defineProps<{
  tournament: TournamentSummary
}>()

const status = computed(() => statusPresentation(props.tournament.status))

/** The one line that says most about where a tournament is right now. */
const progress = computed(() => {
  const t = props.tournament
  if (t.status === 'finished') {
    return t.champion_display_name === null ? 'Finished' : `Won by ${t.champion_display_name}`
  }
  if (t.status === 'running') {
    return `Round ${String(t.current_round)} in play`
  }
  if (t.status === 'ready') {
    return 'Bracket drawn, waiting to start'
  }
  if (t.status === 'cancelled') {
    return 'Cancelled by the organiser'
  }
  return `${String(t.max_players - t.current_players)} of ${String(t.max_players)} places left`
})

const finishedDate = computed(() => {
  if (!props.tournament.finished_at) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(props.tournament.finished_at))
})
</script>

<template>
  <RouterLink :to="`/tournaments/${tournament.id}`" class="block h-full">
    <GlassCard as="article" variant="interactive" class="h-full">
      <div class="gap-3 flex flex-col">
        <div class="gap-3 flex items-start justify-between">
          <h3 class="text-card text-foreground">{{ tournament.name }}</h3>
          <BaseBadge :variant="status.variant">{{ status.label }}</BaseBadge>
        </div>

        <p class="text-small text-foreground-muted">{{ progress }}</p>

        <div class="gap-4 text-small text-foreground-muted flex items-center">
          <span class="gap-1.5 flex items-center tabular-nums">
            <Users :size="14" aria-hidden="true" />
            {{ tournament.current_players }}/{{ tournament.max_players }}
          </span>
          <span v-if="tournament.champion_display_name" class="gap-1.5 text-warning flex items-center">
            <Crown :size="14" aria-hidden="true" />
            {{ tournament.champion_display_name }}
          </span>
          <span v-if="finishedDate" class="gap-1.5 flex items-center ml-auto">
            <Calendar :size="14" aria-hidden="true" />
            {{ finishedDate }}
          </span>
        </div>
      </div>
    </GlassCard>
  </RouterLink>
</template>
