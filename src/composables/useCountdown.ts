import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Seconds remaining until an ISO deadline, ticking once a second and only while
 * there is a deadline to count down to.
 *
 * `onElapsed` fires when the countdown reaches zero. Challenge expiry is
 * announced over the social socket, so a view that also counts down locally can
 * take itself off the screen even when that announcement never arrives.
 */
export function useCountdown(
  expiresAt: Ref<string | null>,
  onElapsed?: () => void,
): { secondsLeft: Ref<number> } {
  const now = ref(Date.now())
  let ticker: ReturnType<typeof setInterval> | null = null

  function stop(): void {
    if (ticker !== null) {
      clearInterval(ticker)
      ticker = null
    }
  }

  const secondsLeft = computed(() => {
    if (expiresAt.value === null) return 0
    return Math.max(0, Math.ceil((new Date(expiresAt.value).getTime() - now.value) / 1000))
  })

  watch(
    expiresAt,
    (deadline) => {
      stop()
      if (deadline === null) return

      now.value = Date.now()
      ticker = setInterval(() => {
        now.value = Date.now()
        if (secondsLeft.value <= 0) {
          stop()
          onElapsed?.()
        }
      }, 1000)
    },
    { immediate: true },
  )

  onBeforeUnmount(stop)

  return { secondsLeft }
}
