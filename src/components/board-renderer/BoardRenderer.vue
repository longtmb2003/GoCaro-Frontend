<script setup lang="ts">
import FantasyBoard2D from './FantasyBoard2D.vue'
import type { BoardRendererEmits, BoardRendererProps, RendererCell } from './rendererTypes'
import type { MoveCueName, VictoryCueName } from './feedbackTiming'
import type { SpiritCueName } from './spiritTiming'
import type { PlayerSymbol } from '@/types/game'

const props = withDefaults(defineProps<BoardRendererProps>(), {
  size: 15,
  lastMove: null,
  winningLine: () => [],
  yourSymbol: null,
  spirits: null,
})

const emit = defineEmits<BoardRendererEmits>()

function forwardMove(x: number, y: number): void {
  emit('move', x, y)
}

function forwardHover(cell: RendererCell | null): void {
  emit('cell-hover', cell)
}

function forwardCellClick(cell: RendererCell): void {
  emit('cell-click', cell)
}

function forwardMoveCue(cue: MoveCueName, symbol: PlayerSymbol, cell: RendererCell): void {
  emit('move-cue', cue, symbol, cell)
}

function forwardVictoryCue(cue: VictoryCueName): void {
  emit('victory-cue', cue)
}

function forwardSpiritCue(cue: SpiritCueName, symbol: PlayerSymbol, spiritId: string): void {
  emit('spirit-cue', cue, symbol, spiritId)
}
</script>

<template>
  <div class="board-renderer-host">
    <FantasyBoard2D
      class="board-renderer-surface"
      :board="props.board"
      :size="props.size"
      :interactive="props.interactive"
      :last-move="props.lastMove"
      :winning-line="props.winningLine"
      :your-symbol="props.yourSymbol"
      :spirits="props.spirits"
      @move="forwardMove"
      @cell-hover="forwardHover"
      @cell-click="forwardCellClick"
      @move-cue="forwardMoveCue"
      @victory-cue="forwardVictoryCue"
      @spirit-cue="forwardSpiritCue"
    />
  </div>
</template>

<style scoped>
.board-renderer-host {
  --resolved-board-size: var(--game-board-size, min(92vw, 62dvh, 38rem));

  display: flex;
  width: var(--resolved-board-size);
  height: var(--resolved-board-size);
  min-height: 0;
  min-width: 0;
  flex: 0 0 auto;
  aspect-ratio: 1 / 1;
  align-items: center;
  justify-content: center;
}

.board-renderer-surface {
  width: 100%;
  height: 100%;
  min-height: 0;
  aspect-ratio: 1 / 1;
}

</style>
