<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

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
const { t } = useAppLanguage()

const SPEEDS = [
  { label: '0.5×', interval: 1400 },
  { label: '1×', interval: 700 },
  { label: '2×', interval: 350 },
  { label: '4×', interval: 175 },
]
</script>

<template>
  <div class="replay-controls">
    <div class="gap-2 flex items-center justify-center">
      <BaseButton variant="secondary" size="sm" :disabled="atStart" :aria-label="t('First move', 'Nước đầu')" @click="emit('first')">
        <ChevronsLeft :size="20" aria-hidden="true" />
      </BaseButton>
      <BaseButton variant="secondary" size="sm" :disabled="atStart" :aria-label="t('Previous move', 'Nước trước')" @click="emit('prev')">
        <ChevronLeft :size="20" aria-hidden="true" />
      </BaseButton>
      <BaseButton :disabled="totalMoves === 0" :aria-label="playing ? t('Pause', 'Tạm dừng') : t('Play', 'Phát')" @click="emit('togglePlay')">
        <Pause v-if="playing" :size="22" aria-hidden="true" />
        <Play v-else :size="22" aria-hidden="true" />
      </BaseButton>
      <BaseButton variant="secondary" size="sm" :disabled="atEnd" :aria-label="t('Next move', 'Nước tiếp')" @click="emit('next')">
        <ChevronRight :size="20" aria-hidden="true" />
      </BaseButton>
      <BaseButton variant="secondary" size="sm" :disabled="atEnd" :aria-label="t('Last move', 'Nước cuối')" @click="emit('last')">
        <ChevronsRight :size="20" aria-hidden="true" />
      </BaseButton>
    </div>

    <p class="text-foreground-muted text-small text-center font-mono tabular-nums">
      {{ t('Move', 'Nước') }} <strong class="text-foreground">{{ moveIndex }}</strong> / {{ totalMoves }}
    </p>

    <div class="grid grid-cols-4 gap-2" role="group" :aria-label="t('Playback speed', 'Tốc độ phát')">
      <BaseButton
        v-for="option in SPEEDS"
        :key="option.interval"
        :variant="speed === option.interval ? 'primary' : 'ghost'"
        size="sm"
        :aria-pressed="speed === option.interval"
        @click="emit('setSpeed', option.interval)"
      >
        {{ option.label }}
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.replay-controls {
  display: grid;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-glass);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(var(--blur-md));
}

.replay-controls :deep(.base-button) {
  min-width: 2.75rem;
  padding-inline: var(--space-md);
}

@media (max-width: 30rem) {
  .replay-controls :deep(.base-button) {
    padding-inline: var(--space-sm);
  }
}
</style>
