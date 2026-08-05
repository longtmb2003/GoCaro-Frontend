<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Music2, SlidersHorizontal, Sparkles, Volume2, VolumeX } from 'lucide-vue-next'

import { useMatchAudio } from '@/composables/useMatchAudio'

type VolumeChannel = 'master' | 'music' | 'sfx'

const audio = useMatchAudio()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

function setChannelVolume(channel: VolumeChannel, event: Event) {
  const target = event.target as HTMLInputElement
  const volume = Number(target.value) / 100
  if (channel === 'master') audio.setMasterVolume(volume)
  else if (channel === 'music') audio.setMusicVolume(volume)
  else audio.setSfxVolume(volume)
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value?.contains(event.target as Node)) return
  open.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !open.value) return
  open.value = false
  trigger.value?.focus()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div ref="root" class="audio-controls">
    <button
      ref="trigger"
      type="button"
      class="audio-trigger"
      :class="{ 'audio-trigger-muted': audio.muted.value }"
      :aria-label="audio.muted.value ? 'Audio muted. Open audio settings' : 'Open audio settings'"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <VolumeX v-if="audio.muted.value" :size="16" aria-hidden="true" />
      <Volume2 v-else :size="16" aria-hidden="true" />
    </button>

    <div v-if="open" class="audio-popover" role="dialog" aria-label="Match audio settings">
      <div class="audio-popover-header">
        <div>
          <p class="audio-title">Combat audio</p>
          <p class="audio-subtitle">Match mix</p>
        </div>
        <SlidersHorizontal :size="16" aria-hidden="true" />
      </div>

      <button
        type="button"
        class="audio-mute"
        :aria-pressed="audio.muted.value"
        @click="audio.toggleMuted()"
      >
        <VolumeX v-if="audio.muted.value" :size="16" aria-hidden="true" />
        <Volume2 v-else :size="16" aria-hidden="true" />
        <span>{{ audio.muted.value ? 'Unmute audio' : 'Mute all audio' }}</span>
        <span class="audio-state">{{ audio.muted.value ? 'Muted' : 'On' }}</span>
      </button>

      <label class="audio-slider">
        <span class="audio-slider-label">
          <Volume2 :size="16" aria-hidden="true" />
          Master
          <output>{{ Math.round(audio.masterVolume.value * 100) }}%</output>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="Math.round(audio.masterVolume.value * 100)"
          aria-label="Master volume"
          @input="setChannelVolume('master', $event)"
        />
      </label>

      <label class="audio-slider">
        <span class="audio-slider-label">
          <Music2 :size="16" aria-hidden="true" />
          Music
          <output>{{ Math.round(audio.musicVolume.value * 100) }}%</output>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="Math.round(audio.musicVolume.value * 100)"
          aria-label="Music volume"
          @input="setChannelVolume('music', $event)"
        />
      </label>

      <label class="audio-slider">
        <span class="audio-slider-label">
          <Sparkles :size="16" aria-hidden="true" />
          Effects
          <output>{{ Math.round(audio.sfxVolume.value * 100) }}%</output>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="Math.round(audio.sfxVolume.value * 100)"
          aria-label="Sound effects volume"
          @input="setChannelVolume('sfx', $event)"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.audio-controls {
  position: relative;
  z-index: 20;
}

.audio-trigger {
  display: inline-flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-button);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-sm), inset 0 1px 0 var(--color-board-frame-metal);
  color: var(--text-secondary);
  transition:
    color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    transform var(--transition-duration-instant) ease-out;
}

.audio-trigger:hover,
.audio-trigger:focus-visible {
  border-color: var(--color-accent);
  background: var(--surface-4);
  color: var(--color-accent);
}

.audio-trigger:active {
  transform: scale(0.98);
}

.audio-trigger-muted {
  color: var(--color-warning);
}

.audio-popover {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 16rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-floating), inset 0 1px 0 var(--color-board-frame-metal);
  padding: 1rem;
  -webkit-backdrop-filter: blur(var(--blur-lg));
  backdrop-filter: blur(var(--blur-lg));
}

.audio-popover-header,
.audio-slider-label,
.audio-mute {
  display: flex;
  align-items: center;
}

.audio-popover-header {
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 0.75rem;
  color: var(--color-accent);
}

.audio-title {
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
}

.audio-subtitle {
  margin-top: 0.125rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.audio-mute {
  width: 100%;
  min-height: 2.75rem;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--surface-glass-light);
  padding: 0 0.75rem;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 600;
}

.audio-mute:hover,
.audio-mute:focus-visible {
  border-color: var(--color-border-strong);
  background: var(--surface-4);
  color: var(--text-foreground);
}

.audio-state {
  margin-left: auto;
  color: var(--color-accent);
  font-size: var(--text-caption);
  text-transform: uppercase;
}

.audio-slider {
  display: block;
  margin-top: 0.75rem;
}

.audio-slider-label {
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 600;
}

.audio-slider-label output {
  margin-left: auto;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-caption);
}

.audio-slider input {
  width: 100%;
  height: 2.75rem;
  accent-color: var(--color-accent);
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .audio-trigger {
    transition: none;
  }

  .audio-trigger:active {
    transform: none;
  }
}
</style>
