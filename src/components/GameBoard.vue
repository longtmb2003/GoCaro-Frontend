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

const fourInRowCells = computed<Set<string>>(() => {
  const set = new Set<string>()
  const b = props.board
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]] as const
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const val = b[x]?.[y]
      if (!val) continue
      
      for (const [dx, dy] of dirs) {
        let count = 1
        let cx = x + dx, cy = y + dy
        while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && b[cx]?.[cy] === val) {
          count++
          cx += dx
          cy += dy
        }
        if (count >= 4) {
          for (let i = 0; i < count; i++) {
            set.add(`${x + i * dx},${y + i * dy}`)
          }
        }
      }
    }
  }
  return set
})

function isFourInRow(cell: Cell): boolean {
  return fourInRowCells.value.has(`${cell.x},${cell.y}`)
}

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
  <div class="relative bg-white/5 backdrop-blur-2xl rounded-2xl p-2 sm:p-3 shadow-[0_0_50px_rgba(192,132,252,0.2)] w-full max-w-xl aspect-square flex flex-col group/board overflow-hidden border border-white/10">
    <!-- Vibrant Outer Glow & Animated Gradient -->
    <div class="absolute inset-[-50%] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none mix-blend-screen opacity-50 group-hover/board:opacity-80 transition-opacity duration-700"></div>
    
    <div
      class="relative grid w-full h-full flex-1 gap-[1px] rounded-xl bg-gradient-to-br from-pink-400/40 via-purple-400/40 to-cyan-400/40 overflow-hidden ring-1 ring-white/20 shadow-inner z-10"
      :style="gridStyle"
      role="grid"
      aria-label="Game board"
    >
      <button
        v-for="cell in cells"
        :key="cell.y * BOARD_SIZE + cell.x"
        type="button"
        class="relative aspect-square bg-white/5 transition-colors focus-visible:z-10 group overflow-hidden"
        :class="isPlayable(cell) ? 'cursor-pointer hover:bg-white/20' : 'cursor-default'"
        :disabled="!isPlayable(cell)"
        :aria-label="label(cell)"
        @click="onCellClick(cell)"
      >
        <!-- Cell hover effect -->
        <div v-if="isPlayable(cell)" class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>

        <!-- 4-in-a-row Warning Highlight -->
        <div v-if="isFourInRow(cell)" class="absolute inset-0 bg-amber-500/30 animate-pulse pointer-events-none"></div>
        <div v-if="isFourInRow(cell)" class="absolute inset-0 ring-2 ring-amber-400/80 shadow-[inset_0_0_15px_rgba(245,158,11,0.5)] pointer-events-none z-0"></div>

        <!-- Render Stone -->
        <div
          v-if="cell.value !== null"
          class="stone-enter absolute inset-[12%] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10"
          :class="[
            cell.value === 1 
              ? 'bg-gradient-to-br from-neutral-700 to-black ring-1 ring-white/20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),0_5px_15px_rgba(0,0,0,0.8)]' 
              : 'bg-gradient-to-br from-white via-indigo-50 to-indigo-200 ring-1 ring-black/10 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.1),0_5px_15px_rgba(255,255,255,0.3)]',
          ]"
        >
          <!-- Reflection -->
          <div class="absolute inset-[15%] rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-60 blur-[1px]"></div>
        </div>
        
        <!-- Last Move Radar Ping -->
        <div v-if="isLastMove(cell)" class="absolute inset-[10%] rounded-full ring-2 ring-indigo-400 animate-ping opacity-75 z-0"></div>
        <div v-if="isLastMove(cell)" class="absolute inset-[10%] rounded-full ring-2 ring-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] z-0"></div>
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
