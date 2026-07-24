<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

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
  const players = mine
    ? `You vs ${shortId(opponentId)}`
    : `${shortId(match.player1_id)} vs ${shortId(match.player2_id)}`

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
  return { outcome: `${shortId(match.winner_id)} won`, tone: 'neutral' }
}

const rows = computed<HistoryRow[]>(() => props.matches.map(toRow))

const toneClass: Record<Tone, string> = {
  win: 'text-success-500',
  loss: 'text-danger-400',
  neutral: 'text-foreground-muted',
}
</script>

<template>
  <ul v-if="rows.length > 0" class="divide-border-subtle divide-y">
    <li v-for="row in rows" :key="row.id">
      <RouterLink
        :to="`/replay/${row.id}`"
        class="hover:bg-surface-elevated -mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors"
        :class="row.mine ? 'bg-primary-600/10' : ''"
      >
        <div class="min-w-0">
          <p class="text-foreground truncate font-medium">
            <span class="font-mono text-sm">{{ row.players }}</span>
          </p>
          <p class="text-foreground-muted mt-1 flex items-center gap-2 text-xs">
            <span
              class="rounded-sm px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase"
              :class="
                row.ranked
                  ? 'bg-primary-600/15 text-primary-400'
                  : 'bg-foreground/5 text-foreground-muted'
              "
            >
              {{ row.ranked ? 'Ranked' : 'Casual' }}
            </span>
            <span>{{ row.date }} · {{ row.moves }} moves</span>
          </p>
        </div>
        <span class="shrink-0 text-sm font-semibold" :class="toneClass[row.tone]">
          {{ row.outcome }}
        </span>
      </RouterLink>
    </li>
  </ul>

  <p v-else class="text-foreground-muted py-8 text-center text-sm">No matches played yet.</p>
</template>
