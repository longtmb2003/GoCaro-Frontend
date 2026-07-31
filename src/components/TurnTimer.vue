<script setup lang="ts">
import { computed, watch } from 'vue'
import { Clock } from 'lucide-vue-next'

const props = defineProps<{
  secondsLeft: number
  totalSeconds: number
}>()

/** Below this many seconds the clock turns red to signal urgency. */
const LOW_SECONDS = 5

const fraction = computed(() =>
  props.totalSeconds > 0 ? Math.min(1, Math.max(0, props.secondsLeft / props.totalSeconds)) : 0,
)

const low = computed(() => props.secondsLeft <= LOW_SECONDS)

function playTickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03)
    
    const volume = low.value ? 0.15 : 0.02
    gain.gain.setValueAtTime(volume, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.03)
  } catch (e) {
    // Ignore audio errors
  }
}

watch(() => props.secondsLeft, (newVal, oldVal) => {
  if (newVal < oldVal && newVal > 0) {
    playTickSound()
  }
})
</script>

<template>
  <div class="flex items-center gap-3" role="timer" aria-live="off">
    <Clock 
      :size="18" 
      class="shrink-0 transition-colors" 
      :class="[
        low ? 'text-danger-500 animate-[shake_0.5s_ease-in-out_infinite]' : 'text-primary-500 animate-[spin_4s_linear_infinite]'
      ]" 
    />
    <div class="bg-surface-elevated h-2 flex-1 overflow-hidden rounded-full shadow-inner">
      <div
        class="h-full rounded-full transition-[width] duration-1000 ease-linear shadow-glow"
        :class="low ? 'bg-danger-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'"
        :style="{ width: `${(fraction * 100).toString()}%` }"
      />
    </div>
    <span
      class="w-8 text-right text-base font-black tabular-nums"
      :class="low ? 'text-danger-400' : 'text-foreground-muted'"
    >
      {{ secondsLeft }}s
    </span>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}
</style>
