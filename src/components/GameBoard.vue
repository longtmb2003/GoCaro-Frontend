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
  return props.lastMove?.x === cell.x && props.lastMove?.y === cell.y
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
  <div class="relative bg-black/40 backdrop-blur-2xl rounded-xl p-2 sm:p-3 border border-indigo-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-full max-w-xl aspect-square flex flex-col">
    <!-- Outer Glow -->
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl pointer-events-none mix-blend-screen"></div>
    
    <div
      class="grid w-full h-full flex-1 gap-[1px] rounded-lg bg-indigo-900/30 overflow-hidden ring-1 ring-indigo-500/30"
      :style="gridStyle"
      role="grid"
      aria-label="Game board"
    >
      <button
        v-for="cell in cells"
        :key="cell.y * BOARD_SIZE + cell.x"
        type="button"
        class="relative aspect-square bg-black/40 transition-colors focus-visible:z-10 group overflow-hidden"
        :class="isPlayable(cell) ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'"
        :disabled="!isPlayable(cell)"
        :aria-label="label(cell)"
        @click="onCellClick(cell)"
      >
        <!-- Cell hover effect -->
        <div v-if="isPlayable(cell)" class="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300"></div>

        <!-- Render Stone -->
        <div
          v-if="cell.value !== null"
          class="stone-enter absolute inset-[12%] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          :class="[
            cell.value === 1 
              ? 'bg-gradient-to-br from-neutral-700 to-black ring-1 ring-white/10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.2),0_5px_15px_rgba(0,0,0,0.8)]' 
              : 'bg-gradient-to-br from-white via-indigo-50 to-indigo-200 ring-1 ring-black/10 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.1),0_5px_15px_rgba(255,255,255,0.3)]',
          ]"
        >
          <!-- Reflection -->
          <div class="absolute inset-[15%] rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50 blur-[1px]"></div>
        </div>
        
        <!-- Last Move Radar Ping -->
        <div v-if="isLastMove(cell)" class="absolute inset-[10%] rounded-full ring-2 ring-indigo-400 animate-ping opacity-75"></div>
        <div v-if="isLastMove(cell)" class="absolute inset-[10%] rounded-full ring-2 ring-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)]"></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes stone-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.stone-enter {
  animation: stone-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .stone-enter {
    animation: none;
  }
}
</style>
