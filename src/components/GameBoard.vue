<script setup lang="ts">
import { computed } from 'vue'

import { BOARD_SIZE, type CellValue } from '@/types/game'

const props = defineProps<{
  board: CellValue[][]
  interactive: boolean
  lastMove: { x: number; y: number } | null
}>()

const emit = defineEmits<{ move: [x: number, y: number] }>()

const gridStyle = { gridTemplateColumns: `repeat(${BOARD_SIZE.toString()}, minmax(0, 1fr))` }

interface Cell {
  x: number
  y: number
  value: CellValue
}

// Flattened in row-major order (y outer, x inner) so the CSS grid lays cells
// out left-to-right, top-to-bottom while coordinates stay board[x][y].
const cells = computed<Cell[]>(() => {
  const list: Cell[] = []
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      list.push({ x, y, value: props.board[x]?.[y] ?? null })
    }
  }
  return list
})

function isPlayable(cell: Cell): boolean {
  return props.interactive && cell.value === null
}

function isLastMove(cell: Cell): boolean {
  return props.lastMove?.x === cell.x && props.lastMove.y === cell.y
}

function label(cell: Cell): string {
  const occupant = cell.value === 1 ? 'black' : cell.value === 2 ? 'white' : 'empty'
  return `Row ${(cell.y + 1).toString()}, column ${(cell.x + 1).toString()}, ${occupant}`
}

function onCellClick(cell: Cell): void {
  if (isPlayable(cell)) {
    emit('move', cell.x, cell.y)
  }
}
</script>

<template>
  <div
    class="grid aspect-square w-full max-w-xl gap-0 rounded-md bg-neutral-700 p-1"
    :style="gridStyle"
    role="grid"
    aria-label="Game board"
  >
    <button
      v-for="cell in cells"
      :key="cell.y * BOARD_SIZE + cell.x"
      type="button"
      class="relative aspect-square border border-neutral-600/70 transition-colors focus-visible:z-10"
      :class="isPlayable(cell) ? 'cursor-pointer hover:bg-neutral-600' : 'cursor-default'"
      :disabled="!isPlayable(cell)"
      :aria-label="label(cell)"
      @click="onCellClick(cell)"
    >
      <span
        v-if="cell.value !== null"
        class="stone-enter absolute inset-[14%] rounded-full"
        :class="[
          cell.value === 1 ? 'bg-neutral-950' : 'bg-neutral-50 ring-1 ring-neutral-400',
          isLastMove(cell) ? 'ring-primary-400 ring-2' : '',
        ]"
      />
    </button>
  </div>
</template>

<style scoped>
@keyframes stone-pop {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.stone-enter {
  animation: stone-pop 150ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .stone-enter {
    animation: none;
  }
}
</style>
