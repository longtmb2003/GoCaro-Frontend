<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { PlayerSymbol } from '@/types/game'
import { MOVE_CUES, VICTORY_CUES } from './feedbackTiming'
import { materializeOffset } from './spiritTiming'
import SpiritStage from './SpiritStage.vue'
import PieceSigil from './PieceSigil.vue'
import type { BoardRendererEmits, BoardRendererProps, RendererCell } from './rendererTypes'
import { spiritForSymbol } from '@/spirits/spiritAssignment'
import { useSpiritMotion } from '@/composables/useSpiritMotion'
import { useSpiritSequence } from '@/composables/useSpiritSequence'

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
  spirits: null,
})

const emit = defineEmits<BoardRendererEmits>()

const spiritMotion = useSpiritMotion()
const spiritSequence = useSpiritSequence({
  profile: () => (props.spirits === null ? 'off' : spiritMotion.profile.value),
  onCue: (cue, request) => {
    emit('spirit-cue', cue, request.symbol, request.spirit.id)
  },
})

/** One beat is the gap the `full` profile leaves between spawn and attack. */
const spiritBeatMs = computed(() => (spiritMotion.profile.value === 'quick' ? 54 : 120))
const hoveredCell = ref<RendererCell | null>(null)
const keyboardCell = ref<RendererCell>({ row: 7, col: 7 })
const gridArea = ref<HTMLElement | null>(null)
const scheduledTimers = new Set<number>()

const cellCount = computed(() => Math.max(1, props.size))
const maxCellIndex = computed(() => cellCount.value - 1)
const gridPositions = computed(() =>
  Array.from({ length: cellCount.value + 1 }, (_, index) => (index / cellCount.value) * 100),
)

/**
 * Star points, the way a go board marks itself.
 *
 * They are landmarks, not decoration: an unmarked 15x15 field gives the eye
 * nothing to count from, so reading a threat means counting cells from the
 * edge. Positions are derived from the board size rather than hardcoded, and
 * they land on cell centres because that is where pieces sit here — a marker
 * on the line intersections would sit between the stones instead of under
 * them. The centre point only exists on an odd board, which is the only kind
 * that has a middle cell.
 */
const starPoints = computed<{ x: number; y: number }[]>(() => {
  const size = cellCount.value
  if (size < 9) return []
  const near = size >= 13 ? 3 : 2
  const far = maxCellIndex.value - near
  const toPercent = (index: number) => ((index + 0.5) / size) * 100
  const points = [
    [near, near],
    [near, far],
    [far, near],
    [far, far],
  ]
  // Four corners and a centre, the renju marking — not go's nine, which would
  // crowd a board this size.
  if (maxCellIndex.value % 2 === 0) {
    const middle = maxCellIndex.value / 2
    points.push([middle, middle])
  }
  return points.map(([col, row]) => ({ x: toPercent(col ?? 0), y: toPercent(row ?? 0) }))
})

/**
 * The board as drawn. `withheldKey` is the one cell whose piece the running
 * spirit sequence has not delivered yet: the move is already applied in the
 * store, it is simply not shown until the attack lands. Nothing else about the
 * board is deferred, so a stalled sequence can only ever hide a single piece.
 */
const pieces = computed<RenderedPiece[]>(() => {
  const withheld = spiritSequence.withheldKey.value
  const result: RenderedPiece[] = []
  for (let row = 0; row < props.size; row += 1) {
    for (let col = 0; col < props.size; col += 1) {
      const symbol = props.board[col]?.[row] ?? null
      const key = `${String(col)}:${String(row)}`
      if (symbol !== null && key !== withheld) result.push({ col, row, symbol, key })
    }
  }
  return result
})

const activeSpirit = computed(() => spiritSequence.current.value?.spirit ?? null)
const activeSpiritSymbol = computed(() => spiritSequence.current.value?.symbol ?? null)
const strikeCell = computed(() => spiritSequence.current.value?.cell ?? null)
const strikeClasses = computed(() => {
  const spirit = activeSpirit.value
  if (spirit === null) return []
  return [
    `spirit-strike-${spirit.motion.strike}`,
    `spirit-strike-from-${spirit.anchor}`,
    activeSpiritSymbol.value === 1 ? 'spirit-strike-x' : 'spirit-strike-o',
  ]
})
const impactClasses = computed(() => {
  const spirit = activeSpirit.value
  if (spirit === null) return []
  return [
    `spirit-impact-${spirit.motion.impact}`,
    `spirit-impact-from-${spirit.anchor}`,
    activeSpiritSymbol.value === 1 ? 'spirit-impact-x' : 'spirit-impact-o',
  ]
})

/**
 * Impact particles fan out along the strike's direction of travel, so the burst
 * still reads as something that arrived rather than something that appeared.
 * Count and spread come from the spirit definition — this is the whole of the
 * particle system, and it is deliberately this small: it runs on every move of
 * every match, so a real emitter would be paying a per-frame cost all game for
 * an effect that is on screen for 200ms.
 */
const impactParticles = computed(() => {
  const spirit = activeSpirit.value
  if (spirit === null) return []
  const { particleCount, particleSpread } = spirit.vfx
  const step = particleCount > 1 ? particleSpread / (particleCount - 1) : 0
  const start = -particleSpread / 2
  return Array.from({ length: particleCount }, (_, index) => ({
    index,
    angle: `${String(start + step * index)}deg`,
  }))
})
const spiritLayerStyle = computed(() => {
  const spirit = activeSpirit.value
  if (spirit === null) return {}
  return {
    '--spirit-accent': `var(${spirit.vfx.accentToken})`,
    '--spirit-trail': `var(${spirit.vfx.trailToken})`,
    '--spirit-beat': `${String(spiritBeatMs.value)}ms`,
  }
})
const showStrike = computed(() => spiritSequence.phase.value === 'strike')
const showImpact = computed(() => spiritSequence.impactKey.value !== '')

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
      cell.col === maxCellIndex.value ||
      cell.row === maxCellIndex.value)
  )
})
const winningBeam = computed(() => {
  const start = props.winningLine[0]
  const end = props.winningLine.at(-1)
  if (!start || !end) return null
  return {
    x1: ((start.x + 0.5) / cellCount.value) * 100,
    y1: ((start.y + 0.5) / cellCount.value) * 100,
    x2: ((end.x + 0.5) / cellCount.value) * 100,
    y2: ((end.y + 0.5) / cellCount.value) * 100,
  }
})
const lastMoveKey = computed(() =>
  props.lastMove ? `${String(props.lastMove.x)}:${String(props.lastMove.y)}` : '',
)

const boardStyle = computed(() => ({
  '--grid-size': String(cellCount.value),
}))

function cellPosition(col: number, row: number): Record<string, string> {
  return {
    left: `${String(((col + 0.5) / cellCount.value) * 100)}%`,
    top: `${String(((row + 0.5) / cellCount.value) * 100)}%`,
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
    col: Math.min(maxCellIndex.value, Math.floor(normalizedX * cellCount.value)),
    row: Math.min(maxCellIndex.value, Math.floor(normalizedY * cellCount.value)),
  }
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
  next.col = Math.min(maxCellIndex.value, Math.max(0, next.col))
  next.row = Math.min(maxCellIndex.value, Math.max(0, next.row))
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

    /*
     * `off` starts no sequence at all rather than one whose beats all land on
     * frame zero. Collapsing them would still fire every cue, and the audio
     * layer would answer with a spawn, an attack and an impact stacked on the
     * same millisecond — a player who turned spirits off would hear the one
     * thing they asked not to have.
     */
    const profile = props.spirits === null ? 'off' : spiritMotion.profile.value
    if (props.spirits !== null && profile !== 'off') {
      spiritSequence.start({
        key,
        cell,
        symbol,
        spirit: spiritForSymbol(props.spirits, symbol),
      })
    }

    /*
     * Placement audio is re-anchored to the moment the piece actually appears.
     * Left at zero it would announce a stone that is still half a beat away,
     * which reads as the sound being early rather than the piece being late.
     */
    const offset = materializeOffset(profile)
    for (const cue of MOVE_CUES) {
      schedule(cue.at + offset, () => {
        emit('move-cue', cue.name, symbol, cell)
      })
    }
  },
)

/**
 * Any input during a sequence ends it early — the spec's skippability, and the
 * reason a spirit never costs a player a turn. The pointerdown that plays the
 * next move also lands here, which is harmless: it fast-forwards the previous
 * summon, which is exactly what starting a new one would have done anyway.
 */
function skipSpiritSequence(): void {
  if (spiritSequence.isRunning.value) spiritSequence.skip()
}

onMounted(() => {
  window.addEventListener('pointerdown', skipSpiritSequence)
  window.addEventListener('keydown', skipSpiritSequence)
})

watch(
  () => props.spirits,
  (spirits) => {
    if (spirits === null) spiritSequence.cancel()
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
  window.removeEventListener('pointerdown', skipSpiritSequence)
  window.removeEventListener('keydown', skipSpiritSequence)
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
      src="/gocaro-fantasy-board-2d-v1.webp"
      alt=""
      loading="eager"
      decoding="async"
      fetchpriority="high"
      draggable="false"
      aria-hidden="true"
    />
    <span class="fantasy-frame-energy" aria-hidden="true"></span>

    <SpiritStage
      :spirit="activeSpirit"
      :symbol="activeSpiritSymbol"
      :phase="spiritSequence.phase.value"
      :beat-ms="spiritBeatMs"
    />

    <div
      class="fantasy-playfield"
      :class="{ 'fantasy-playfield-disabled': !interactive }"
      role="application"
      tabindex="0"
      :aria-label="`Gomoku board, ${String(size)} by ${String(size)} cells. Selected row ${String(keyboardCell.row + 1)}, column ${String(keyboardCell.col + 1)}.`"
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
          <g class="fantasy-grid-stars">
            <circle
              v-for="point in starPoints"
              :key="`star-${String(point.x)}-${String(point.y)}`"
              :cx="point.x"
              :cy="point.y"
              r="0.62"
            />
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
        </div>

        <div
          v-if="strikeCell && showStrike"
          :key="`strike-${spiritSequence.current.value?.key ?? ''}`"
          class="spirit-strike"
          :class="strikeClasses"
          :style="{ ...cellPosition(strikeCell.col, strikeCell.row), ...spiritLayerStyle }"
          aria-hidden="true"
        >
          <span class="spirit-strike-core"></span>
          <span class="spirit-strike-trail"></span>
        </div>

        <div
          v-if="strikeCell && showImpact"
          :key="`impact-${spiritSequence.current.value?.key ?? ''}`"
          class="spirit-impact"
          :class="impactClasses"
          :style="{ ...cellPosition(strikeCell.col, strikeCell.row), ...spiritLayerStyle }"
          aria-hidden="true"
        >
          <span class="spirit-impact-burst"></span>
          <span class="spirit-impact-ring"></span>
          <span
            v-for="particle in impactParticles"
            :key="particle.index"
            class="spirit-impact-particle"
            :style="{ '--particle-angle': particle.angle }"
          ></span>
        </div>

        <!-- The piece's own settle flash waits for the piece: while a summon is
             still in flight this cell has nothing on it yet. -->
        <div
          v-if="lastMove && lastMoveKey !== spiritSequence.withheldKey.value"
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
          <PieceSigil :shape="piece.symbol === 1 ? 'x' : 'o'" />
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
