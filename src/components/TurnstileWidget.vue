<template>
  <div ref="container" class="turnstile-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import type { TurnstileFailure } from '@/types/turnstile'

/** The slice of the Turnstile global this component uses. */
interface TurnstileApi {
  render(element: HTMLElement, options: Record<string, unknown>): string
  remove(widgetId: string): void
  reset(widgetId: string): void
}

function turnstileApi(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile
}

const props = defineProps<{
  theme?: 'auto' | 'light' | 'dark'
  /**
   * Analytics label sent with the challenge. It does NOT select the widget
   * mode — Managed, Non-interactive and Invisible are properties of the
   * sitekey, configured in the Cloudflare dashboard.
   */
  action?: string
}>()

const emit = defineEmits<{
  (e: 'verify', token: string): void
  (e: 'error', reason: TurnstileFailure): void
  (e: 'expire'): void
}>()

const container = ref<HTMLElement | null>(null)
const widgetId = ref<string | null>(null)

// api.js is loaded async from challenges.cloudflare.com by index.html. Ad
// blockers and some networks block that host outright, in which case it never
// arrives. Polling for it forever would leave the player looking at an empty
// box with no way forward, so the wait is bounded and then reported.
const SCRIPT_WAIT_MS = 10_000
const POLL_INTERVAL_MS = 100
const SCRIPT_ID = 'gocaro-turnstile-api'

let pollTimer: number | null = null
let waitedMs = 0

// Loading Turnstile only when verification is actually shown keeps the
// third-party script off the critical rendering path for ordinary visits.
function loadScript(): void {
  if (turnstileApi() || document.getElementById(SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.defer = true
  document.head.append(script)
}

function clearPoll(): void {
  if (pollTimer !== null) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function render(): void {
  if (!container.value) return

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  if (!siteKey) {
    emit('error', 'missing-site-key')
    return
  }

  const turnstile = turnstileApi()
  if (turnstile) {
    clearPoll()
    widgetId.value = turnstile.render(container.value, {
      sitekey: siteKey,
      theme: props.theme ?? 'dark',
      action: props.action ?? 'matchmaking',
      callback: (token: string) => {
        emit('verify', token)
      },
      'error-callback': () => {
        emit('error', 'challenge-failed')
      },
      'expired-callback': () => {
        emit('expire')
      },
    })
    return
  }

  if (waitedMs >= SCRIPT_WAIT_MS) {
    clearPoll()
    emit('error', 'script-unavailable')
    return
  }
  waitedMs += POLL_INTERVAL_MS
  pollTimer = window.setTimeout(render, POLL_INTERVAL_MS)
}

/** Starts over: a fresh wait and a fresh widget, for a retry after a failure. */
function retry(): void {
  clearPoll()
  waitedMs = 0
  remove()
  render()
}

function remove(): void {
  const turnstile = turnstileApi()
  if (widgetId.value !== null && turnstile) {
    turnstile.remove(widgetId.value)
  }
  widgetId.value = null
}

function reset(): void {
  const turnstile = turnstileApi()
  if (widgetId.value !== null && turnstile) {
    turnstile.reset(widgetId.value)
  }
}

onMounted(() => {
  loadScript()
  render()
})

// The poll has to be cancelled as well as the widget: a pending timeout would
// otherwise fire against a component that is already gone.
onUnmounted(() => {
  clearPoll()
  remove()
})

defineExpose({ reset, retry })
</script>

<style scoped>
.turnstile-container {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  min-height: 65px;
}
</style>
