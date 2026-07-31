<script setup lang="ts">
import { computed, watch } from 'vue'
import { X, Circle } from 'lucide-vue-next'

import { BOARD_SIZE, type CellValue } from '@/types/game'

const props = defineProps<{
  board: CellValue[][]
  interactive: boolean
  lastMove: { x: number; y: number } | null
  yourSymbol: 1 | 2 | null
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
        if (count === 4) {
          for (let i = 0; i < count; i++) {
            set.add(`${x + i * dx},${y + i * dy}`)
          }
        }
      }
    }
  }
  return set
})

const fiveInRowCells = computed<Set<string>>(() => {
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
        if (count >= 5) {
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

function isFiveInRow(cell: Cell): boolean {
  return fiveInRowCells.value.has(`${cell.x},${cell.y}`)
}

function isPlayable(cell: Cell): boolean {
  return props.interactive && cell.value === null
}

function isLastMove(cell: Cell): boolean {
  return props.lastMove?.x === cell.x && props.lastMove?.y === cell.y
}

function label(cell: Cell): string {
  const occupant = cell.value === 1 ? 'X' : cell.value === 2 ? 'O' : 'empty'
  return `Row ${(cell.y + 1).toString()}, column ${(cell.x + 1).toString()}, ${occupant}`
}

function playTick() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05)
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.05)
  } catch (e) {
    // Ignore audio errors
  }
}

watch(() => props.lastMove, (newVal, oldVal) => {
  if (newVal && (newVal.x !== oldVal?.x || newVal.y !== oldVal?.y)) {
    playTick()
  }
}, { deep: true })

function onCellClick(cell: Cell): void {
  if (isPlayable(cell)) {
    emit('move', cell.x, cell.y)
  }
}
</script>

<template>
  <div class="relative bg-surface rounded-2xl p-2 sm:p-3 shadow-glow w-full max-w-xl aspect-square flex flex-col group/board overflow-hidden border border-border-strong">
    
    <div
      class="relative grid w-full h-full flex-1 gap-[1px] rounded-xl bg-white/[0.14] overflow-hidden ring-1 ring-border shadow-inner z-10"
      :style="gridStyle"
      role="grid"
      aria-label="Game board"
    >
      <button
        v-for="cell in cells"
        :key="cell.y * BOARD_SIZE + cell.x"
        type="button"
        class="relative aspect-square bg-surface-sunken transition-colors focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none group overflow-hidden"
        :class="isPlayable(cell) ? 'cursor-pointer hover:bg-surface' : 'cursor-default'"
        :disabled="!isPlayable(cell)"
        :aria-label="label(cell)"
        @click="onCellClick(cell)"
      >
        <!-- Ghost Piece Hover Preview -->
        <div v-if="isPlayable(cell)" class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity duration-150 pointer-events-none">
          <template v-if="props.yourSymbol === 1">
            <X class="w-[80%] h-[80%] text-blue-400" stroke-width="4" />
          </template>
          <template v-else-if="props.yourSymbol === 2">
            <Circle class="w-[65%] h-[65%] text-rose-400" stroke-width="4" />
          </template>
        </div>

        <!-- 4-in-a-row Warning Highlight -->
        <div v-if="isFourInRow(cell) && !isFiveInRow(cell)" class="absolute inset-0 bg-warning/20 animate-pulse pointer-events-none z-0"></div>

        <!-- 5-in-a-row Winning Line Highlight -->
        <div v-if="isFiveInRow(cell)" class="absolute inset-0 bg-accent/30 ring-2 ring-accent shadow-[0_0_15px_rgba(46,230,255,0.6)] animate-pulse pointer-events-none z-20 rounded-sm"></div>

        <!-- Render Symbol -->
        <div
          v-if="cell.value !== null"
          class="stone-enter absolute inset-0 flex items-center justify-center z-10"
          :class="[
            cell.value === 1 
              ? 'text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.9)]' 
              : 'text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.9)]',
          ]"
        >
          <X v-if="cell.value === 1" class="w-[80%] h-[80%]" stroke-width="4" />
          <Circle v-else class="w-[65%] h-[65%]" stroke-width="4" />
        </div>
        
        <!-- Last Move Persistent Marker -->
        <div v-if="isLastMove(cell)" class="absolute inset-[20%] rounded-full border-2 border-white/60 z-20 pointer-events-none"></div>
        <!-- Last Move Radar Ping -->
        <div v-if="isLastMove(cell)" class="absolute inset-[15%] rounded-full ring-2 ring-accent animate-ping opacity-75 z-0 pointer-events-none"></div>
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
