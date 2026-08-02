<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { MatchSummary } from '@/types/match'
import { formatDate, shortId } from '@/utils/format'

const props = defineProps<{
  matches: MatchSummary[]
  currentUserId: string
}>()

type Tone = 'win' | 'loss' | 'neutral'

interface HistoryRow {
  id: string
  mine: boolean
  players: string
  outcome: string
  tone: Tone
  ranked: boolean
  moves: number
  date: string
}

function toRow(match: MatchSummary): HistoryRow {
  const isPlayer1 = match.player1_id === props.currentUserId
  const mine = isPlayer1 || match.player2_id === props.currentUserId
  const opponentId = isPlayer1 ? match.player2_id : match.player1_id
  const opponentName = isPlayer1 ? match.player2_name : match.player1_name
  const players = mine
    ? `You vs ${opponentName || shortId(opponentId)}`
    : `${match.player1_name || shortId(match.player1_id)} vs ${match.player2_name || shortId(match.player2_id)}`

  const { outcome, tone } = describeOutcome(match, mine)

  return {
    id: match.id,
    mine,
    players,
    outcome,
    tone,
    ranked: match.is_ranked,
    moves: match.total_moves,
    date: formatDate(match.created_at),
  }
}

function describeOutcome(match: MatchSummary, mine: boolean): { outcome: string; tone: Tone } {
  if (match.status === 'in_progress') {
    return { outcome: 'In progress', tone: 'neutral' }
  }
  if (match.status === 'abandoned') {
    return { outcome: 'Abandoned', tone: 'neutral' }
  }
  if (match.winner_id === null) {
    return { outcome: 'Draw', tone: 'neutral' }
  }
  if (mine) {
    return match.winner_id === props.currentUserId
      ? { outcome: 'Win', tone: 'win' }
      : { outcome: 'Loss', tone: 'loss' }
  }
  const winnerName = match.winner_id === match.player1_id ? match.player1_name : match.player2_name
  return { outcome: `${winnerName || shortId(match.winner_id)} won`, tone: 'neutral' }
}

const rows = computed<HistoryRow[]>(() => props.matches.map(toRow))

const toneClass: Record<Tone, string> = {
  win: 'text-success-400 drop-shadow-sm',
  loss: 'text-danger-400 drop-shadow-sm',
  neutral: 'text-white/60',
}
</script>

<template>
  <ul v-if="rows.length > 0" class="divide-white/10 divide-y">
    <li v-for="row in rows" :key="row.id">
      <RouterLink
        :to="`/replay/${row.id}`"
        class="hover:bg-white/5 -mx-2 flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-all duration-300"
        :class="row.mine ? 'bg-primary-500/10' : ''"
      >
        <div class="min-w-0">
          <p class="text-white truncate font-bold drop-shadow-sm">
            <span class="font-mono text-sm">{{ row.players }}</span>
          </p>
          <p class="text-foreground-muted text-small gap-2 mt-1 flex items-center">
            <BaseBadge :variant="row.ranked ? 'primary' : 'neutral'" shape="tag">
              {{ row.ranked ? 'Ranked' : 'Casual' }}
            </BaseBadge>
            <span>{{ row.date }} · {{ row.moves }} moves</span>
          </p>
        </div>
        <span
          class="shrink-0 text-sm font-black uppercase tracking-wider"
          :class="toneClass[row.tone]"
        >
          {{ row.outcome }}
        </span>
      </RouterLink>
    </li>
  </ul>

  <p v-else class="text-white/50 py-8 text-center text-sm font-medium">No matches played yet.</p>
</template>
