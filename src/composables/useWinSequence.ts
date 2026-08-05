import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { MatchPhase } from '@/types/game'

/** The CSS placement sequence settles before the winning pattern is revealed. */
export const FINAL_MOVE_LAND_MS = 260
export const POST_LAND_HOLD_MS = 200
export const WIN_PATTERN_DELAY_MS = FINAL_MOVE_LAND_MS + POST_LAND_HOLD_MS
/** Pattern reveal (rings + beam) resolves before the lightweight title enters. */
export const WIN_BANNER_DELAY_MS = 1_500
export const WIN_COUNTDOWN_DELAY_MS = WIN_BANNER_DELAY_MS
/** Preserve the resolved winning pattern for a full three-second countdown. */
export const WIN_SEQUENCE_DURATION_MS = WIN_COUNTDOWN_DELAY_MS + 3_000

/**
 * Runs only while a confirmed match is in `finishing`. The temporary RAF is
 * elapsed-time based, is cancelled on every phase change, and cannot complete
 * a newer match because each run owns a generation token.
 */
export function useWinSequence(
  phase: () => MatchPhase,
  complete: () => void,
) {
  const elapsedMs = ref(0)
  const generation = ref(0)
  let animationFrame: number | null = null

  function cancel(): void {
    generation.value += 1
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }

  function start(): void {
    cancel()
    elapsedMs.value = 0
    const currentGeneration = generation.value
    const startedAt = performance.now()

    const tick = (now: number): void => {
      if (currentGeneration !== generation.value || phase() !== 'finishing') return
      elapsedMs.value = Math.min(WIN_SEQUENCE_DURATION_MS, now - startedAt)
      if (elapsedMs.value >= WIN_SEQUENCE_DURATION_MS) {
        animationFrame = null
        if (currentGeneration === generation.value && phase() === 'finishing') complete()
        return
      }
      animationFrame = window.requestAnimationFrame(tick)
    }

    animationFrame = window.requestAnimationFrame(tick)
  }

  watch(
    phase,
    (nextPhase) => {
      if (nextPhase === 'finishing') start()
      else {
        cancel()
        elapsedMs.value = 0
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(cancel)

  return {
    elapsedMs,
    showWinningPattern: computed(() => (
      phase() === 'finishing' && elapsedMs.value >= WIN_PATTERN_DELAY_MS
    )),
    showOverlay: computed(() => phase() === 'finishing' && elapsedMs.value >= WIN_BANNER_DELAY_MS),
    showCountdown: computed(() => elapsedMs.value >= WIN_COUNTDOWN_DELAY_MS),
    countdownSeconds: computed(() => Math.max(
      0,
      Math.ceil(
        (WIN_SEQUENCE_DURATION_MS - elapsedMs.value)
          / ((WIN_SEQUENCE_DURATION_MS - WIN_COUNTDOWN_DELAY_MS) / 3),
      ),
    )),
    cancel,
  }
}
