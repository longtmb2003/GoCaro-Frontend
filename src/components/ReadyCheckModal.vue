<script setup lang="ts">
import { computed, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { MatchProposedPayload } from '@/types/game'

const props = defineProps<{
  proposal: MatchProposedPayload
  secondsLeft: number
}>()

const emit = defineEmits<{
  (e: 'accept' | 'decline'): void
}>()

const { t } = useAppLanguage()

const hasResponded = ref(false)

function onAccept() {
  hasResponded.value = true
  emit('accept')
}

function onDecline() {
  hasResponded.value = true
  emit('decline')
}

// The ring empties as the offer runs out. Guarded against a zero timeout so a
// misconfigured window cannot divide by zero.
const remainingFraction = computed(() => {
  const total = props.proposal.timeout_seconds
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, props.secondsLeft / total))
})

const urgent = computed(() => props.secondsLeft <= 5)

// For SVG circular progress bar
// r = 48, circumference = 2 * PI * 48 = 301.59
const circumference = 301.59
const dashoffset = computed(() => circumference * (1 - remainingFraction.value))
</script>

<template>
  <div class="ready-check-overlay">
    <div
      class="ready-check-container"
      role="alertdialog"
      aria-modal="true"
      :aria-label="t('Match found', 'Đã tìm thấy trận')"
    >
      <div class="ready-check-circle">
        <!-- Circular Progress Ring -->
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle class="progress-ring-bg" cx="50" cy="50" r="48" />
          <circle
            class="progress-ring-fg"
            :class="{ urgent }"
            cx="50"
            cy="50"
            r="48"
            :style="{ strokeDasharray: circumference, strokeDashoffset: dashoffset }"
          />
        </svg>

        <!-- Inner Content -->
        <div class="ready-check-inner">
          <p class="ready-check-eyebrow">
            {{
              proposal.ranked
                ? t('Ranked match found', 'Đã tìm thấy trận xếp hạng')
                : t('Match found', 'Đã tìm thấy trận')
            }}
          </p>
          <div class="ready-check-divider"></div>

          <h2 class="ready-check-opponent">{{ proposal.opponent }}</h2>
          <p class="ready-check-count">{{ secondsLeft }}s</p>

          <p v-if="proposal.ranked" class="ready-check-note">
            {{ t('Rating at stake', 'Ảnh hưởng điểm hạng') }}
          </p>

          <div v-if="!hasResponded" class="ready-check-actions">
            <BaseButton class="action-btn accept-btn" @click="onAccept">
              {{ t('ACCEPT', 'CHẤP NHẬN') }}
            </BaseButton>
            <button class="decline-btn" @click="onDecline">
              {{ t('Decline', 'Từ chối') }}
            </button>
          </div>
          <div v-else class="ready-check-actions">
            <p class="ready-check-waiting">
              {{ t('Waiting for opponent...', 'Đang chờ đối thủ...') }}
            </p>
          </div>
        </div>
      </div>

      <p class="ready-check-warning">
        {{
          t(
            'Declining or ignoring matches repeatedly locks matchmaking for a while.',
            'Từ chối hoặc bỏ qua trận nhiều lần liên tiếp sẽ bị khoá tìm trận một thời gian.',
          )
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.ready-check-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 5, 16, 0.85);
  backdrop-filter: blur(8px);
  animation: fade-in 200ms ease-out;
}

.ready-check-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: pop-in 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.ready-check-circle {
  position: relative;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgb(15 25 40 / 0.9) 0%, rgb(5 10 20 / 0.95) 100%);
  box-shadow:
    0 0 40px rgba(0, 160, 255, 0.2),
    inset 0 0 20px rgba(0, 160, 255, 0.1);
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* Start from top */
  pointer-events: none;
}

.progress-ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 2;
}

.progress-ring-fg {
  fill: none;
  stroke: #0ac8f5;
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 6px rgba(10, 200, 245, 0.6));
}

.progress-ring-fg.urgent {
  stroke: #ff4a4a;
  filter: drop-shadow(0 0 6px rgba(255, 74, 74, 0.6));
}

.ready-check-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  padding: 2rem;
  z-index: 2;
}

.ready-check-eyebrow {
  color: #c8aa6e;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(200, 170, 110, 0.3);
}

.ready-check-divider {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c8aa6e, transparent);
  margin-bottom: 1.25rem;
}

.ready-check-opponent {
  color: #ffffff;
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.ready-check-count {
  color: var(--text-secondary);
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  margin-bottom: 1rem;
}

.ready-check-note {
  color: #ffaa00;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.ready-check-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.action-btn {
  width: 160px;
  height: 48px;
  font-size: 1.05rem;
  font-weight: bold;
  letter-spacing: 0.1em;
  border-radius: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.accept-btn {
  background: linear-gradient(180deg, #1e3c5a 0%, #0c2033 100%);
  border: 1px solid #0ac8f5;
  color: #0ac8f5;
  transition: all 0.2s ease;
}

.accept-btn:hover {
  background: linear-gradient(180deg, #2a527a 0%, #15324d 100%);
  border-color: #fff;
  color: #fff;
  box-shadow: 0 0 15px rgba(10, 200, 245, 0.4);
  transform: translateY(-2px);
}

.decline-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0.5rem;
}

.decline-btn:hover {
  color: #ff4a4a;
}

.ready-check-warning {
  margin-top: 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  text-align: center;
  max-width: 320px;
}

.ready-check-waiting {
  color: var(--text-secondary);
  font-size: 1.05rem;
  margin-top: 1rem;
  animation: pulse 2s infinite ease-in-out;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
