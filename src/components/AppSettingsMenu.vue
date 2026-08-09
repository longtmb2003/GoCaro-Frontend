<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Check,
  Languages,
  Music2,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-vue-next'

import { useAppLanguage, type LanguageCode } from '@/composables/useAppLanguage'
import { useMatchAudio } from '@/composables/useMatchAudio'

type VolumeChannel = 'music' | 'sfx'

const COPY = {
  en: {
    title: 'Settings',
    subtitle: 'Audio and language',
    audio: 'Audio',
    open: 'Open settings',
    mutedOpen: 'Audio muted. Open settings',
    mute: 'Mute all audio',
    unmute: 'Unmute audio',
    muted: 'Muted',
    on: 'On',
    music: 'Music',
    musicVolume: 'Music volume',
    effects: 'Sound effects',
    effectsVolume: 'Sound effects volume',
    language: 'Language',
    spirits: 'Spirit companions',
    spiritsHint: 'How much of the summon plays on each move.',
    spiritsReduced: 'Off while your system asks for reduced motion.',
    spiritsOverride: 'Force enable anyway',
  },
  vi: {
    title: 'Cài đặt',
    subtitle: 'Âm thanh và ngôn ngữ',
    audio: 'Âm thanh',
    open: 'Mở cài đặt',
    mutedOpen: 'Âm thanh đang tắt. Mở cài đặt',
    mute: 'Tắt toàn bộ âm thanh',
    unmute: 'Bật âm thanh',
    muted: 'Đã tắt',
    on: 'Đang bật',
    music: 'Nhạc nền',
    musicVolume: 'Âm lượng nhạc nền',
    effects: 'Hiệu ứng âm thanh',
    effectsVolume: 'Âm lượng hiệu ứng',
    language: 'Ngôn ngữ',
    spirits: 'Linh thú đồng hành',
    spiritsHint: 'Mức độ hiệu ứng triệu hồi ở mỗi nước đi.',
    spiritsReduced: 'Đang tắt vì hệ thống yêu cầu giảm chuyển động.',
    spiritsOverride: 'Vẫn bật bất chấp hệ thống',
  },
} as const

const audio = useMatchAudio()
const appLanguage = useAppLanguage()
const ui = computed(() => COPY[appLanguage.language.value])
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const popover = ref<HTMLElement | null>(null)

function setChannelVolume(channel: VolumeChannel, event: Event): void {
  const target = event.target as HTMLInputElement
  const volume = Number(target.value) / 100
  if (channel === 'music') audio.setMusicVolume(volume)
  else audio.setSfxVolume(volume)
}

function selectLanguage(language: LanguageCode): void {
  appLanguage.setLanguage(language)
}


function closeAndRestoreFocus(): void {
  open.value = false
  trigger.value?.focus()
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (root.value?.contains(event.target as Node)) return
  open.value = false
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) closeAndRestoreFocus()
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  popover.value?.querySelector<HTMLButtonElement>('button')?.focus()
})

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
  <div ref="root" class="app-settings">
    <button
      ref="trigger"
      type="button"
      class="app-settings__trigger"
      :class="{ 'app-settings__trigger--muted': audio.muted.value }"
      :aria-label="audio.muted.value ? ui.mutedOpen : ui.open"
      :title="ui.title"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <Settings :size="18" aria-hidden="true" />
      <span v-if="audio.muted.value" class="app-settings__muted-indicator" aria-hidden="true">
        <VolumeX :size="10" />
      </span>
    </button>

    <div
      v-if="open"
      ref="popover"
      class="app-settings__popover"
      role="dialog"
      :aria-label="ui.title"
    >
      <header class="app-settings__header">
        <div>
          <h2>{{ ui.title }}</h2>
          <p>{{ ui.subtitle }}</p>
        </div>
        <Settings :size="18" aria-hidden="true" />
      </header>

      <section class="app-settings__section" aria-labelledby="settings-audio-heading">
        <h3 id="settings-audio-heading" class="app-settings__section-title">
          <Volume2 :size="15" aria-hidden="true" />
          {{ ui.audio }}
        </h3>

        <button
          type="button"
          class="app-settings__mute"
          :aria-pressed="audio.muted.value"
          @click="audio.toggleMuted()"
        >
          <VolumeX v-if="audio.muted.value" :size="16" aria-hidden="true" />
          <Volume2 v-else :size="16" aria-hidden="true" />
          <span>{{ audio.muted.value ? ui.unmute : ui.mute }}</span>
          <span class="app-settings__state">{{ audio.muted.value ? ui.muted : ui.on }}</span>
        </button>

        <label class="app-settings__slider">
          <span class="app-settings__slider-label">
            <Music2 :size="16" aria-hidden="true" />
            {{ ui.music }}
            <output>{{ Math.round(audio.musicVolume.value * 100) }}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(audio.musicVolume.value * 100)"
            :aria-label="ui.musicVolume"
            @input="setChannelVolume('music', $event)"
          />
        </label>

        <label class="app-settings__slider">
          <span class="app-settings__slider-label">
            <Sparkles :size="16" aria-hidden="true" />
            {{ ui.effects }}
            <output>{{ Math.round(audio.sfxVolume.value * 100) }}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(audio.sfxVolume.value * 100)"
            :aria-label="ui.effectsVolume"
            @input="setChannelVolume('sfx', $event)"
          />
        </label>
      </section>


      <section class="app-settings__section" aria-labelledby="settings-language-heading">
        <h3 id="settings-language-heading" class="app-settings__section-title">
          <Languages :size="15" aria-hidden="true" />
          {{ ui.language }}
        </h3>
        <div class="app-settings__choices">
          <button
            v-for="option in appLanguage.languageOptions"
            :key="option.code"
            type="button"
            :class="{ 'app-settings__choice--active': appLanguage.language.value === option.code }"
            :aria-pressed="appLanguage.language.value === option.code"
            @click="selectLanguage(option.code)"
          >
            <span>{{ option.label }}</span>
            <Check
              v-if="appLanguage.language.value === option.code"
              :size="15"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.app-settings {
  position: relative;
  z-index: 60;
}

.app-settings__trigger {
  position: relative;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
  padding: 0;
  place-items: center;
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

.app-settings__trigger:hover,
.app-settings__trigger:focus-visible,
.app-settings__trigger[aria-expanded='true'] {
  border-color: var(--color-accent);
  background: var(--surface-4);
  color: var(--color-accent);
}

.app-settings__trigger:active {
  transform: scale(0.98);
}

.app-settings__trigger--muted {
  color: var(--color-warning);
}

.app-settings__muted-indicator {
  position: absolute;
  right: 0.2rem;
  bottom: 0.2rem;
  display: grid;
  width: 1rem;
  height: 1rem;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-4);
  color: var(--color-warning);
}

.app-settings__popover {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: min(19rem, calc(100vw - 2rem));
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-floating), inset 0 1px 0 var(--color-board-frame-metal);
  padding: 1rem;
  -webkit-backdrop-filter: blur(var(--blur-lg));
  backdrop-filter: blur(var(--blur-lg));
}

.app-settings__header,
.app-settings__section-title,
.app-settings__mute,
.app-settings__slider-label,
.app-settings__choices button {
  display: flex;
  align-items: center;
}

.app-settings__header {
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-accent);
}

.app-settings__header h2 {
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
}

.app-settings__header p {
  margin-top: 0.125rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.app-settings__section {
  padding-top: 0.75rem;
}

.app-settings__section + .app-settings__section {
  margin-top: 0.75rem;
  border-top: 1px solid var(--color-border-subtle);
}

.app-settings__section-title {
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.app-settings__mute,
.app-settings__choices button {
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--surface-glass-light);
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 600;
}

.app-settings__mute {
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0 0.75rem;
}

.app-settings__mute:hover,
.app-settings__mute:focus-visible,
.app-settings__choices button:hover,
.app-settings__choices button:focus-visible {
  border-color: var(--color-border-strong);
  background: var(--surface-4);
  color: var(--text-foreground);
}

.app-settings__state {
  margin-left: auto;
  color: var(--color-accent);
  font-size: var(--text-caption);
  text-transform: uppercase;
}

.app-settings__slider {
  display: block;
  margin-top: 0.75rem;
}

.app-settings__slider-label {
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 600;
}

.app-settings__slider-label output {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-variant-numeric: tabular-nums;
}

.app-settings__slider input {
  width: 100%;
  height: 2.75rem;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.app-settings__choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.app-settings__choices--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.app-settings__choices button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-settings__hint {
  margin-top: 0.375rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.app-settings__override-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--text-secondary);
  font-size: var(--text-caption);
  cursor: pointer;
}

.app-settings__override-label input {
  accent-color: var(--color-accent);
  cursor: pointer;
}

.app-settings__choices button {
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.75rem;
}

.app-settings__choices .app-settings__choice--active {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--text-foreground);
}

:global(.app-layout--fantasy) .app-settings__trigger {
  border-color: color-mix(in srgb, var(--color-accent) 14%, transparent);
  background: color-mix(in srgb, var(--surface-4) 78%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text-foreground) 8%, transparent);
}

:global(.app-layout--fantasy) .app-settings__trigger:hover,
:global(.app-layout--fantasy) .app-settings__trigger:focus-visible,
:global(.app-layout--fantasy) .app-settings__trigger[aria-expanded='true'] {
  border-color: color-mix(in srgb, var(--color-accent) 24%, transparent);
  background: color-mix(in srgb, var(--surface-4) 88%, transparent);
}

:global(.app-layout--fantasy) .app-settings__popover {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-4) 96%, transparent),
      color-mix(in srgb, var(--surface-background) 96%, transparent)
    ),
    var(--surface-glass-strong);
}

@media (max-width: 30rem) {
  .app-settings__popover {
    position: fixed;
    top: 4.25rem;
    right: 1rem;
    left: 1rem;
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-settings__trigger {
    transition: none;
  }

  .app-settings__trigger:active {
    transform: none;
  }
}
</style>
