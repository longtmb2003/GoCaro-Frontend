<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { PlayerSymbol } from '@/types/game'
import { MOVE_CUES, VICTORY_CUES } from './feedbackTiming'
import type { BoardRendererEmits, BoardRendererProps, RendererCell } from './rendererTypes'

interface RenderedPiece {
  col: number
  row: number
  symbol: PlayerSymbol
  key: string
}

const props = withDefaults(defineProps<BoardRendererProps>(), {
  size: 15,
  lastMove: null,
  winningLine: () => [],
  yourSymbol: null,
})

const emit = defineEmits<BoardRendererEmits>()
const hoveredCell = ref<RendererCell | null>(null)
const keyboardCell = ref<RendererCell>({ row: 7, col: 7 })
const gridArea = ref<HTMLElement | null>(null)
const scheduledTimers = new Set<number>()

const divisions = computed(() => Math.max(1, props.size - 1))
const gridPositions = computed(() =>
  Array.from({ length: props.size }, (_, index) => (index / divisions.value) * 100),
)

const pieces = computed<RenderedPiece[]>(() => {
  const result: RenderedPiece[] = []
  for (let row = 0; row < props.size; row += 1) {
    for (let col = 0; col < props.size; col += 1) {
      const symbol = props.board[col]?.[row] ?? null
      if (symbol !== null) result.push({ col, row, symbol, key: `${String(col)}:${String(row)}` })
    }
  }
  return result
})

const winningKeys = computed(
  () => new Set(props.winningLine.map((cell) => `${String(cell.x)}:${String(cell.y)}`)),
)
const hasWinningLine = computed(() => props.winningLine.length >= 5)
const hoveredCellIsEdge = computed(() => {
  const cell = hoveredCell.value
  return (
    cell !== null &&
    (cell.col === 0 ||
      cell.row === 0 ||
      cell.col === divisions.value ||
      cell.row === divisions.value)
  )
})
const winningBeam = computed(() => {
  const start = props.winningLine[0]
  const end = props.winningLine.at(-1)
  if (!start || !end) return null
  return {
    x1: (start.x / divisions.value) * 100,
    y1: (start.y / divisions.value) * 100,
    x2: (end.x / divisions.value) * 100,
    y2: (end.y / divisions.value) * 100,
  }
})
const lastMoveKey = computed(() =>
  props.lastMove ? `${String(props.lastMove.x)}:${String(props.lastMove.y)}` : '',
)

const boardStyle = computed(() => ({
  '--grid-divisions': String(divisions.value),
}))

function cellPosition(col: number, row: number): Record<string, string> {
  return {
    left: `${String((col / divisions.value) * 100)}%`,
    top: `${String((row / divisions.value) * 100)}%`,
  }
}

function isPlayable(cell: RendererCell): boolean {
  return props.interactive && (props.board[cell.col]?.[cell.row] ?? null) === null
}

function setHoveredCell(cell: RendererCell | null): void {
  const playableCell = cell !== null && isPlayable(cell) ? cell : null
  if (hoveredCell.value?.col === playableCell?.col && hoveredCell.value?.row === playableCell?.row)
    return
  hoveredCell.value = playableCell
  emit('cell-hover', playableCell)
}

function cellFromPointer(event: PointerEvent): RendererCell {
  const bounds =
    gridArea.value?.getBoundingClientRect() ??
    (event.currentTarget as HTMLElement).getBoundingClientRect()
  const normalizedX = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
  const normalizedY = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
  return {
    col: Math.round(normalizedX * divisions.value),
    row: Math.round(normalizedY * divisions.value),
  }
}

function isEdgePosition(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === 100 || y === 100
}

function onPointerMove(event: PointerEvent): void {
  setHoveredCell(cellFromPointer(event))
}

function play(cell: RendererCell): void {
  if (!isPlayable(cell)) return
  emit('cell-click', cell)
  emit('move', cell.col, cell.row)
}

function onPointerClick(event: PointerEvent): void {
  play(cellFromPointer(event))
}

function onKeydown(event: KeyboardEvent): void {
  const next = { ...keyboardCell.value }
  if (event.key === 'ArrowLeft') next.col -= 1
  else if (event.key === 'ArrowRight') next.col += 1
  else if (event.key === 'ArrowUp') next.row -= 1
  else if (event.key === 'ArrowDown') next.row += 1
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    play(next)
    return
  } else return

  event.preventDefault()
  next.col = Math.min(divisions.value, Math.max(0, next.col))
  next.row = Math.min(divisions.value, Math.max(0, next.row))
  keyboardCell.value = next
  setHoveredCell(next)
}

function schedule(delaySeconds: number, callback: () => void): void {
  const timer = window.setTimeout(() => {
    scheduledTimers.delete(timer)
    callback()
  }, delaySeconds * 1000)
  scheduledTimers.add(timer)
}

watch(
  () => lastMoveKey.value,
  (key, previousKey) => {
    if (!key || key === previousKey || !props.lastMove) return
    const symbol = props.board[props.lastMove.x]?.[props.lastMove.y] ?? null
    if (symbol === null) return
    const cell = { row: props.lastMove.y, col: props.lastMove.x }
    for (const cue of MOVE_CUES) {
      schedule(cue.at, () => {
        emit('move-cue', cue.name, symbol, cell)
      })
    }
  },
)

watch(
  () => props.winningLine.map((cell) => `${String(cell.x)}:${String(cell.y)}`).join('|'),
  (key, previousKey) => {
    if (!key || key === previousKey || !hasWinningLine.value) return
    for (const cue of VICTORY_CUES) {
      schedule(cue.at, () => {
        emit('victory-cue', cue.name)
      })
    }
  },
)

onBeforeUnmount(() => {
  for (const timer of scheduledTimers) window.clearTimeout(timer)
  scheduledTimers.clear()
})
</script>

<template>
  <div
    class="fantasy-board"
    :class="{ 'fantasy-board-winning': hasWinningLine }"
    :style="boardStyle"
  >
    <img
      class="fantasy-board-art"
      src="/gocaro-fantasy-board-2d-v1.png"
      alt=""
      loading="eager"
      decoding="async"
      fetchpriority="high"
      draggable="false"
      aria-hidden="true"
    />
    <span class="fantasy-frame-energy" aria-hidden="true"></span>

    <div
      class="fantasy-playfield"
      :class="{ 'fantasy-playfield-disabled': !interactive }"
      role="application"
      tabindex="0"
      :aria-label="`Gomoku board, ${String(size)} by ${String(size)} intersections. Selected row ${String(keyboardCell.row + 1)}, column ${String(keyboardCell.col + 1)}.`"
      @pointermove="onPointerMove"
      @pointerleave="setHoveredCell(null)"
      @click="onPointerClick"
      @keydown="onKeydown"
      @focus="setHoveredCell(keyboardCell)"
      @blur="setHoveredCell(null)"
    >
      <div
        ref="gridArea"
        class="fantasy-grid-area"
        :class="{ 'fantasy-grid-area-edge-hover': hoveredCellIsEdge }"
      >
        <svg
          class="fantasy-grid"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g class="fantasy-grid-lines">
            <template v-for="position in gridPositions" :key="`line-${String(position)}`">
              <line :x1="position" y1="0" :x2="position" y2="100" />
              <line x1="0" :y1="position" x2="100" :y2="position" />
            </template>
          </g>
          <g class="fantasy-grid-nodes">
            <template v-for="x in gridPositions" :key="`node-column-${String(x)}`">
              <circle
                v-for="y in gridPositions"
                :key="`node-${String(x)}-${String(y)}`"
                :cx="x"
                :cy="y"
                :r="isEdgePosition(x, y) ? 0.34 : 0.26"
                :class="{ 'fantasy-grid-node-edge': isEdgePosition(x, y) }"
              />
            </template>
          </g>
        </svg>

        <div
          v-if="hoveredCell"
          class="placement-marker"
          :class="{ 'placement-marker-edge': hoveredCellIsEdge }"
          :style="cellPosition(hoveredCell.col, hoveredCell.row)"
          aria-hidden="true"
        >
          <span class="placement-marker-ring"></span>
          <span class="placement-marker-node"></span>
          <span
            v-if="yourSymbol"
            class="game-piece game-piece-preview"
            :class="yourSymbol === 1 ? 'game-piece-x' : 'game-piece-o'"
          >
            <span v-if="yourSymbol === 1" class="x-bar x-bar-forward"></span>
            <span v-if="yourSymbol === 1" class="x-bar x-bar-backward"></span>
            <span v-else class="o-ring"></span>
          </span>
        </div>

        <div
          v-if="lastMove"
          :key="`feedback-${lastMoveKey}`"
          class="placement-feedback"
          :style="cellPosition(lastMove.x, lastMove.y)"
          aria-hidden="true"
        >
          <span class="placement-flash"></span>
          <span class="placement-wave"></span>
        </div>

        <div
          v-for="piece in pieces"
          :key="piece.key"
          class="game-piece"
          :class="[
            piece.symbol === 1 ? 'game-piece-x' : 'game-piece-o',
            piece.key === lastMoveKey ? 'game-piece-latest' : '',
            winningKeys.has(piece.key) ? 'game-piece-winning' : '',
            hasWinningLine && !winningKeys.has(piece.key) ? 'game-piece-dimmed' : '',
          ]"
          :style="cellPosition(piece.col, piece.row)"
          aria-hidden="true"
        >
          <span v-if="piece.symbol === 1" class="x-bar x-bar-forward"></span>
          <span v-if="piece.symbol === 1" class="x-bar x-bar-backward"></span>
          <span v-else class="o-ring"></span>
          <span v-if="piece.key === lastMoveKey" class="last-move-ring"></span>
        </div>

        <svg
          v-if="winningBeam"
          class="winning-beam"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line class="winning-beam-aura" v-bind="winningBeam" />
          <line class="winning-beam-core" v-bind="winningBeam" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped src="./FantasyBoard2D.css"></style>
