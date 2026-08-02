<script setup lang="ts">
import { computed } from 'vue'

import BracketSlotCard from '@/components/BracketSlotCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { BracketSlot } from '@/types/tournament'
import { groupByRound } from '@/utils/tournament'

const props = defineProps<{
  slots: BracketSlot[]
}>()

const rounds = computed(() => groupByRound(props.slots))
</script>

<template>
  <EmptyState
    v-if="rounds.length === 0"
    title="No bracket yet"
    description="The bracket is drawn once the field is full."
  />

  <!--
    Rounds read left to right on a wide screen and top to bottom on a narrow
    one. The horizontal scroll is on this container alone, so a 16-player
    bracket never makes the page itself scroll sideways.
  -->
  <div v-else class="-mx-2 px-2 overflow-x-auto overscroll-x-contain md:mx-0 md:px-0">
    <ol class="gap-4 flex min-w-full flex-col md:flex-row md:items-start">
      <li
        v-for="round in rounds"
        :key="round.round"
        class="gap-3 flex min-w-56 flex-1 flex-col"
      >
        <h3 class="text-caption text-foreground-muted tracking-wider uppercase">
          {{ round.label }}
        </h3>
        <ul class="gap-3 flex flex-col">
          <li v-for="pairing in round.slots" :key="pairing.id">
            <BracketSlotCard :pairing="pairing" />
          </li>
        </ul>
      </li>
    </ol>
  </div>
</template>
