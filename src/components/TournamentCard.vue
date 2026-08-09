<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, Crown, Users } from 'lucide-vue-next'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import type { TournamentSummary } from '@/types/tournament'
import { statusPresentation } from '@/utils/tournament'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  tournament: TournamentSummary
}>()
const { language, t } = useAppLanguage()

const status = computed(() => {
  const presentation = statusPresentation(props.tournament.status)
  const labels = {
    registration: t('Open', 'Đang mở'),
    ready: t('Full', 'Đã đủ'),
    running: t('Live', 'Đang diễn ra'),
    finished: t('Finished', 'Đã kết thúc'),
    cancelled: t('Cancelled', 'Đã hủy'),
  }
  return { ...presentation, label: labels[props.tournament.status] }
})

/** The one line that says most about where a tournament is right now. */
const progress = computed(() => {
  const tournament = props.tournament
  if (tournament.status === 'finished') {
    return tournament.champion_display_name === null
      ? t('Finished', 'Đã kết thúc')
      : `${t('Won by', 'Vô địch bởi')} ${tournament.champion_display_name}`
  }
  if (tournament.status === 'running') {
    return `${t('Round', 'Vòng')} ${String(tournament.current_round)} ${t('in play', 'đang diễn ra')}`
  }
  if (tournament.status === 'ready') {
    return t('Bracket drawn, waiting to start', 'Đã có nhánh đấu, đang chờ bắt đầu')
  }
  if (tournament.status === 'cancelled') {
    return t('Cancelled by the organiser', 'Đã bị ban tổ chức hủy')
  }
  return `${String(tournament.max_players - tournament.current_players)}/${String(tournament.max_players)} ${t('places left', 'chỗ còn lại')}`
})

const finishedDate = computed(() => {
  if (!props.tournament.finished_at) return null
  return new Intl.DateTimeFormat(language.value === 'vi' ? 'vi-VN' : 'en-US', {
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
