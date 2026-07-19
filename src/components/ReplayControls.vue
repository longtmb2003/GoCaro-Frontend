<script setup lang="ts">
defineProps<{
  moveIndex: number
  totalMoves: number
  atStart: boolean
  atEnd: boolean
  playing: boolean
  speed: number
}>()

const emit = defineEmits<{
  first: []
  prev: []
  next: []
  last: []
  togglePlay: []
  setSpeed: [interval: number]
}>()

// Interval between auto-play steps, in milliseconds.
const SPEEDS: { label: string; interval: number }[] = [
  { label: '0.5×', interval: 1400 },
  { label: '1×', interval: 700 },
  { label: '2×', interval: 350 },
]

const buttonClass =
  'flex size-9 items-center justify-center rounded-md border border-border-subtle bg-surface text-foreground transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40'
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-center gap-2">
      <button
        type="button"
        :class="buttonClass"
        :disabled="atStart"
        aria-label="First move"
        @click="emit('first')"
      >
        «
      </button>
      <button
        type="button"
        :class="buttonClass"
        :disabled="atStart"
        aria-label="Previous move"
        @click="emit('prev')"
      >
        ‹
      </button>
      <button
        type="button"
        :class="buttonClass"
        :disabled="totalMoves === 0"
        :aria-label="playing ? 'Pause' : 'Play'"
        @click="emit('togglePlay')"
      >
        {{ playing ? '‖' : '▶' }}
      </button>
      <button
        type="button"
        :class="buttonClass"
        :disabled="atEnd"
        aria-label="Next move"
        @click="emit('next')"
      >
        ›
      </button>
      <button
        type="button"
        :class="buttonClass"
        :disabled="atEnd"
        aria-label="Last move"
        @click="emit('last')"
      >
        »
      </button>
    </div>

    <p class="text-foreground-muted text-center text-sm tabular-nums">
      Move {{ moveIndex }} / {{ totalMoves }}
    </p>

    <div class="flex items-center justify-center gap-2" role="group" aria-label="Playback speed">
      <button
        v-for="option in SPEEDS"
        :key="option.interval"
        type="button"
        class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        :class="
          speed === option.interval
            ? 'bg-primary-600 text-white'
            : 'text-foreground-muted hover:text-foreground'
        "
        :aria-pressed="speed === option.interval"
        @click="emit('setSpeed', option.interval)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
