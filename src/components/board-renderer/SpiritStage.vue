<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import SpiritSigil from './SpiritSigil.vue'
import type { SpiritCueName } from './spiritTiming'
import type { ResolvedSpirit } from '@/spirits/spiritTypes'
import type { PlayerSymbol } from '@/types/game'

/**
 * The summoned companion itself.
 *
 * It is mounted as a sibling of `.fantasy-playfield`, inside the board frame
 * band, and is sized and positioned so that it cannot reach the playfield —
 * obstruction is prevented by layout, not by tuning a transform until it looks
 * clear. The attack it throws is drawn separately, inside the grid area, since
 * only that layer knows where a cell is.
 */
const props = defineProps<{
  spirit: ResolvedSpirit | null
  symbol: PlayerSymbol | null
  phase: SpiritCueName | 'idle'
  /** Length of one beat, so the `quick` profile compresses the poses too. */
  beatMs: number
}>()

const visible = computed(
  () => props.spirit !== null && props.phase !== 'idle' && props.phase !== 'clear',
)

const stageStyle = computed(() => {
  const spirit = props.spirit
  if (spirit === null) return {}
  return {
    '--spirit-accent': `var(${spirit.vfx.accentToken})`,
    '--spirit-trail': `var(${spirit.vfx.trailToken})`,
    '--spirit-beat': `${String(props.beatMs)}ms`,
  }
})

const stageClasses = computed(() => {
  const spirit = props.spirit
  if (spirit === null) return []
  return [
    `spirit-stage-spawn-${spirit.motion.spawn}`,
    `spirit-stage-attack-${spirit.motion.attack}`,
    `spirit-stage-return-${spirit.motion.return}`,
    props.symbol === 1 ? 'spirit-stage-x' : 'spirit-stage-o',
  ]
})

const needsFlip = computed(() => {
  const spirit = props.spirit
  if (spirit === null) return false
  const seatAnchor = props.symbol === 1 ? 'left' : 'right'
  return spirit.anchor !== seatAnchor
})

const failed = ref(false)

watch(() => props.spirit?.id, () => {
  failed.value = false
})
</script>

<template>
  <div
    v-if="visible && spirit"
    class="spirit-stage"
    :class="stageClasses"
    :style="stageStyle"
    :data-phase="phase"
    aria-hidden="true"
  >
    <span class="spirit-stage-aura"></span>
    <img
      v-if="spirit.model.source && !failed"
      class="spirit-stage-art"
      :class="{ 'flip-art': needsFlip }"
      :src="spirit.model.source"
      alt=""
      draggable="false"
      decoding="async"
      @error="failed = true"
    />
    <SpiritSigil v-else class="spirit-stage-figure" :class="{ 'flip-art': needsFlip }" :shape="spirit.sigil" />
  </div>
</template>

<style scoped src="./SpiritStage.css"></style>
