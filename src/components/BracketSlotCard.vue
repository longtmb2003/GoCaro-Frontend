<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Play, Repeat } from 'lucide-vue-next'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import type { BracketSlot } from '@/types/tournament'
import { useAppLanguage } from '@/composables/useAppLanguage'

// Named `pairing` rather than `slot`: `slot` is a reserved attribute in Vue
// templates, so a prop of that name cannot be bound.
const props = defineProps<{
  pairing: BracketSlot
}>()
const { t } = useAppLanguage()

/**
 * A seat that has no player yet is waiting on the match that feeds it; one with
 * a player but no name belonged to an account that has since been deleted.
 */
function seatName(id: string | null, displayName: string | null): string {
  if (id === null) return t('Awaiting winner', 'Đang chờ người thắng')
  return displayName ?? t('Former player', 'Người chơi cũ')
}

const first = computed(() => seatName(props.pairing.player1_id, props.pairing.player1_display_name))
const second = computed(() =>
  seatName(props.pairing.player2_id, props.pairing.player2_display_name)
)

const isWinner = (id: string | null): boolean =>
  id !== null && props.pairing.winner_id !== null && id === props.pairing.winner_id

const decided = computed(() => props.pairing.winner_id !== null)

const statusLabel = computed(() => {
  switch (props.pairing.status) {
    case 'walkover':
      return t('Walkover', 'Thắng mặc định')
    case 'in_progress':
      return t('Playing', 'Đang chơi')
    case 'finished':
      return t('Decided', 'Đã phân định')
    default:
      return props.pairing.called_at === null ? t('Waiting', 'Đang chờ') : t('Called', 'Đã gọi trận')
  }
})

const statusVariant = computed(() => {
  switch (props.pairing.status) {
    case 'in_progress':
      return 'success' as const
    case 'walkover':
      return 'warning' as const
    case 'finished':
      return 'neutral' as const
    default:
      return props.pairing.called_at === null ? ('neutral' as const) : ('primary' as const)
  }
})

/** A decided slot links to its replay; a live one is not replayable yet. */
const replayTo = computed(() =>
  props.pairing.match_id !== null && decided.value ? `/replay/${props.pairing.match_id}` : null,
)

import { useUserProfile } from '@/composables/useUserProfile'
const { openProfile } = useUserProfile()
</script>

<template>
  <GlassCard as="div" variant="nested" class="gap-2 flex flex-col">
    <div class="gap-2 flex items-center justify-between">
      <span class="text-caption text-foreground-muted tracking-wider uppercase">
        {{ t('Match', 'Trận') }} {{ pairing.slot + 1 }}
      </span>
      <BaseBadge :variant="statusVariant" shape="tag">{{ statusLabel }}</BaseBadge>
    </div>

    <ul class="gap-1 flex flex-col">
      <li
        class="gap-2 text-small flex items-center justify-between"
        :class="isWinner(pairing.player1_id) ? 'text-foreground font-semibold' : 'text-foreground-muted'"
      >
        <button
          v-if="pairing.player1_id"
          class="truncate hover:text-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded text-left"
          @click="openProfile(pairing.player1_id)"
        >
          {{ first }}
        </button>
        <span v-else class="truncate">{{ first }}</span>
        <span v-if="isWinner(pairing.player1_id)" class="text-success text-caption uppercase shrink-0">{{ t('Won', 'Thắng') }}</span>
      </li>
      <li
        class="gap-2 text-small flex items-center justify-between"
        :class="isWinner(pairing.player2_id) ? 'text-foreground font-semibold' : 'text-foreground-muted'"
      >
        <button
          v-if="pairing.player2_id"
          class="truncate hover:text-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded text-left"
          @click="openProfile(pairing.player2_id)"
        >
          {{ second }}
        </button>
        <span v-else class="truncate">{{ second }}</span>
        <span v-if="isWinner(pairing.player2_id)" class="text-success text-caption uppercase shrink-0">{{ t('Won', 'Thắng') }}</span>
      </li>
    </ul>

    <div v-if="pairing.rematch_count > 0 || replayTo" class="gap-3 flex items-center justify-between">
      <span
        v-if="pairing.rematch_count > 0"
        class="gap-1 text-caption text-warning flex items-center"
        :title="t(`Replayed after ${String(pairing.rematch_count)} draw${pairing.rematch_count === 1 ? '' : 's'}`, `Đấu lại sau ${String(pairing.rematch_count)} trận hòa`)"
      >
        <Repeat :size="12" aria-hidden="true" />
        {{ pairing.rematch_count }}
      </span>
      <RouterLink
        v-if="replayTo"
        :to="replayTo"
        class="ml-auto"
        :aria-label="`${t('Watch replay of Match', 'Xem replay trận')} ${pairing.slot + 1}`"
      >
        <BaseButton variant="ghost" size="sm" class="gap-1.5 flex items-center">
          <Play :size="14" aria-hidden="true" />
          {{ t('Watch replay', 'Xem replay') }}
        </BaseButton>
      </RouterLink>
    </div>
  </GlassCard>
</template>
