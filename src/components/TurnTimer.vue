<script setup lang="ts">
import { computed, watch } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  secondsLeft: number
  totalSeconds: number
}>()
const { t } = useAppLanguage()

const tone = computed<'normal' | 'warning' | 'critical'>(() => {
  if (props.secondsLeft < 5) return 'critical'
  if (props.secondsLeft <= 10) return 'warning'
  return 'normal'
})

function playTickSound(): void {
  window.dispatchEvent(new CustomEvent('gocaro:timer-cue', {
    detail: { secondsLeft: props.secondsLeft, tone: tone.value },
  }))
}

watch(() => props.secondsLeft, (newVal, oldVal) => {
  if (newVal < oldVal && newVal > 0) {
    playTickSound()
  }
})
</script>

<template>
  <div
    class="timer-inline flex items-center justify-end gap-2"
    :data-tone="tone"
    role="timer"
    aria-live="off"
    :aria-label="`${secondsLeft} ${t('seconds remaining', 'giây còn lại')}`"
  >
    <Clock
      :size="18"
      class="timer-icon shrink-0"
      :class="{ 'timer-critical': tone === 'critical' }"
      aria-hidden="true"
    />
    <span class="timer-value text-body font-black tabular-nums">{{ secondsLeft }}</span>
    <span class="text-caption font-semibold uppercase tracking-widest text-foreground-muted">{{ t('seconds', 'giây') }}</span>
  </div>
</template>

<style scoped>
@keyframes timer-breathe {
  0%, 100% { opacity: 0.72; transform: scale(0.94); }
  50% { opacity: 1; transform: scale(1.06); }
}

.timer-critical {
  animation: timer-breathe 0.8s ease-in-out infinite;
}

.timer-icon,
.timer-value {
  color: var(--color-accent);
  transition: color var(--transition-duration-normal) ease-out;
}

.timer-inline[data-tone='warning'] .timer-icon,
.timer-inline[data-tone='warning'] .timer-value {
  color: var(--color-warning);
}

.timer-inline[data-tone='critical'] .timer-icon,
.timer-inline[data-tone='critical'] .timer-value {
  color: var(--color-error);
}

@media (prefers-reduced-motion: reduce) {
  .timer-critical {
    animation: none;
  }
}
</style>
