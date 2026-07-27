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

const SPEEDS: { label: string; interval: number }[] = [
  { label: '0.5×', interval: 1400 },
  { label: '1×', interval: 700 },
  { label: '2×', interval: 350 },
]

const buttonClass =
  'flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-white/30 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 text-lg font-black'
</script>

<template>
  <div class="space-y-4 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/5">
    <div class="flex items-center justify-center gap-3">
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
        class="!size-12 !text-xl bg-primary-500/20 border-primary-500/30 text-primary-300 hover:bg-primary-500/30 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(45,212,191,0.4)]"
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

    <p class="text-white/70 text-center text-sm font-semibold tracking-wide tabular-nums">
      Move <span class="text-white font-bold">{{ moveIndex }}</span> / {{ totalMoves }}
    </p>

    <div class="flex items-center justify-center gap-2" role="group" aria-label="Playback speed">
      <button
        v-for="option in SPEEDS"
        :key="option.interval"
        type="button"
        class="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
        :class="
          speed === option.interval
            ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(45,212,191,0.4)] border border-primary-400/50'
            : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
        "
        :aria-pressed="speed === option.interval"
        @click="emit('setSpeed', option.interval)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
