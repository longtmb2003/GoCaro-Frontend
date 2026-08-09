<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CirclePlay } from 'lucide-vue-next'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { MatchSummary } from '@/types/match'
import { formatDate, shortId } from '@/utils/format'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  matches: MatchSummary[]
  currentUserId: string
}>()
const { t } = useAppLanguage()

type Tone = 'win' | 'loss' | 'neutral'

interface HistoryRow {
  id: string
  mine: boolean
  players: string
  handles: string
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
    ? `${t('You', 'Bạn')} vs ${opponentName || shortId(opponentId)}`
    : `${match.player1_name || shortId(match.player1_id)} vs ${match.player2_name || shortId(match.player2_id)}`
  const opponentUsername = isPlayer1 ? match.player2_username : match.player1_username
  const handles = mine
    ? opponentUsername
      ? `${t('Opponent', 'Đối thủ')} @${opponentUsername}`
      : t('Guest opponent', 'Đối thủ khách')
    : [match.player1_username, match.player2_username]
        .filter(Boolean)
        .map((username) => `@${username}`)
        .join(' vs ')

  const { outcome, tone } = describeOutcome(match, mine)

  return {
    id: match.id,
    mine,
    players,
    handles,
    outcome,
    tone,
    ranked: match.is_ranked,
    moves: match.total_moves,
    date: formatDate(match.created_at),
  }
}

function describeOutcome(match: MatchSummary, mine: boolean): { outcome: string; tone: Tone } {
  if (match.status === 'in_progress') {
    return { outcome: t('In progress', 'Đang diễn ra'), tone: 'neutral' }
  }
  if (match.status === 'abandoned') {
    return { outcome: t('Abandoned', 'Đã hủy'), tone: 'neutral' }
  }
  if (match.winner_id === null) {
    return { outcome: t('Draw', 'Hòa'), tone: 'neutral' }
  }
  if (mine) {
    return match.winner_id === props.currentUserId
      ? { outcome: t('Win', 'Thắng'), tone: 'win' }
      : { outcome: t('Loss', 'Thua'), tone: 'loss' }
  }
  const winnerName = match.winner_id === match.player1_id ? match.player1_name : match.player2_name
  return { outcome: `${winnerName || shortId(match.winner_id)} ${t('won', 'đã thắng')}`, tone: 'neutral' }
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
              {{ row.ranked ? t('Ranked', 'Xếp hạng') : t('Casual', 'Đấu thường') }}
            </BaseBadge>
            <span>{{ row.date }} · {{ row.moves }} {{ t('moves', 'nước') }}</span>
          </p>
          <p class="text-accent text-caption mt-1 font-mono">{{ row.handles }}</p>
        </div>
        <span class="gap-3 flex shrink-0 items-center">
          <span class="text-sm font-black uppercase tracking-wider" :class="toneClass[row.tone]">
            {{ row.outcome }}
          </span>
          <CirclePlay :size="22" class="text-accent" :aria-label="t('Watch replay', 'Xem replay')" />
        </span>
      </RouterLink>
    </li>
  </ul>

  <p v-else class="text-white/50 py-8 text-center text-sm font-medium">{{ t('No matches played yet.', 'Chưa có trận đấu nào.') }}</p>
</template>
