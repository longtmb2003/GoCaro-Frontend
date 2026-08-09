import { computed, onBeforeUnmount, ref } from 'vue'

import {
  materializeOffset,
  spiritCues,
  type SpiritCueName,
  type SpiritMotionProfile,
} from '@/components/board-renderer/spiritTiming'
import type { RendererCell } from '@/components/board-renderer/rendererTypes'
import type { ResolvedSpirit } from '@/spirits/spiritTypes'
import type { PlayerSymbol } from '@/types/game'

export interface SpiritSequenceRequest {
  key: string
  cell: RendererCell
  symbol: PlayerSymbol
  spirit: ResolvedSpirit
}

export interface SpiritSequenceOptions {
  /** Read fresh on every move so a settings change takes effect immediately. */
  profile: () => SpiritMotionProfile
  /** Fired on every beat, in order, for audio and any other passive listener. */
  onCue: (cue: SpiritCueName, request: SpiritSequenceRequest) => void
}

/**
 * Drives one spirit summon from confirmed move to clean board.
 *
 * The board itself is never touched: the store applies the server's move the
 * instant it arrives, and this machine only decides *when that move becomes
 * visible*. That separation is what keeps a purely cosmetic system from being
 * able to desync the game — if every timer here failed to fire, the piece would
 * still be on the board, just invisible, and the next move's collapse would
 * reveal it.
 */
export function useSpiritSequence(options: SpiritSequenceOptions) {
  const current = ref<SpiritSequenceRequest | null>(null)
  const phase = ref<SpiritCueName | 'idle'>('idle')
  const materialized = ref(true)
  const timers = new Set<number>()

  let pendingCues: { name: SpiritCueName; at: number }[] = []

  const isRunning = computed(() => current.value !== null && phase.value !== 'clear')
  /**
   * The move whose piece is being withheld. The board hides exactly this one
   * cell, never a set — only one sequence is ever in flight, because a second
   * move collapses the first before starting.
   */
  const withheldKey = computed(() =>
    current.value !== null && !materialized.value ? current.value.key : '',
  )
  /** Set from the impact beat until the board is clean again. */
  const impactKey = computed(() => {
    if (current.value === null) return ''
    const showing = phase.value === 'impact' || phase.value === 'materialize' || phase.value === 'return'
    return showing ? current.value.key : ''
  })

  function clearTimers(): void {
    for (const timer of timers) window.clearTimeout(timer)
    timers.clear()
  }

  function apply(cue: SpiritCueName, request: SpiritSequenceRequest): void {
    phase.value = cue
    if (cue === 'materialize') materialized.value = true
    if (cue === 'clear') current.value = null
    options.onCue(cue, request)
  }

  /**
   * Runs every beat that has not fired yet, immediately and in order. Used both
   * by the skip affordance and by a move arriving mid-sequence, so the two paths
   * cannot end in different states — the end state is always "piece placed,
   * stage empty".
   */
  function fastForward(): void {
    const request = current.value
    if (request === null) return
    clearTimers()
    const remaining = pendingCues
    pendingCues = []
    for (const cue of remaining) apply(cue.name, request)
    current.value = null
    phase.value = 'idle'
    materialized.value = true
  }

  function start(request: SpiritSequenceRequest): void {
    fastForward()

    const profile = options.profile()
    const cues = spiritCues(profile)

    current.value = request
    phase.value = 'idle'
    materialized.value = materializeOffset(profile) === 0

    pendingCues = cues.map((cue) => ({ name: cue.name, at: cue.at }))

    for (const cue of cues) {
      if (cue.at === 0) {
        pendingCues = pendingCues.filter((pending) => pending.name !== cue.name)
        apply(cue.name, request)
        continue
      }
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        pendingCues = pendingCues.filter((pending) => pending.name !== cue.name)
        if (current.value?.key === request.key) apply(cue.name, request)
      }, cue.at * 1000)
      timers.add(timer)
    }

    // An all-zero profile ('off', or reduced motion) has already run to the end
    // synchronously above; leave no half-open sequence behind.
    if (pendingCues.length === 0) {
      current.value = null
      phase.value = 'idle'
      materialized.value = true
    }
  }

  /** Player asked to get on with it. Same end state as letting it finish. */
  function skip(): void {
    fastForward()
  }

  /** Match ended or board was replaced: drop the sequence without firing cues. */
  function cancel(): void {
    clearTimers()
    pendingCues = []
    current.value = null
    phase.value = 'idle'
    materialized.value = true
  }

  onBeforeUnmount(cancel)

  return {
    // `computed` rather than `readonly`: the latter deep-freezes the spirit's
    // tone arrays into `readonly[]`, which no longer satisfies the definition
    // type the stage is handed.
    current: computed(() => current.value),
    phase: computed(() => phase.value),
    isRunning,
    withheldKey,
    impactKey,
    start,
    skip,
    cancel,
  }
}
