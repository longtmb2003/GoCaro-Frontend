<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import TurnstileWidget from '@/components/TurnstileWidget.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { TurnstileFailure } from '@/types/turnstile'

const emit = defineEmits<{
  (e: 'verify', token: string): void
  (e: 'close'): void
}>()

const { t } = useAppLanguage()

const failure = ref<TurnstileFailure | null>(null)
// Remounting the widget is the only way to get a genuinely fresh challenge
// after one has failed or expired, so retrying bumps this key.
const widgetKey = ref(0)

function handleVerify(token: string) {
  emit('verify', token)
}

function handleError(reason: TurnstileFailure) {
  failure.value = reason
}

// An expired token was never used, so replace it silently rather than showing
// the player a failure they did nothing to cause.
function handleExpire() {
  widgetKey.value++
}

function retry() {
  failure.value = null
  widgetKey.value++
}

function failureMessage(reason: TurnstileFailure): string {
  switch (reason) {
    case 'missing-site-key':
      return t(
        'Verification is not configured on this site. Please contact support.',
        'Trang này chưa được cấu hình xác thực. Vui lòng liên hệ hỗ trợ.',
      )
    case 'script-unavailable':
      // Overwhelmingly the cause is an ad blocker or a network that blocks
      // challenges.cloudflare.com, so the message names it.
      return t(
        'The verification service could not be reached. An ad blocker or your network may be blocking it.',
        'Không kết nối được dịch vụ xác thực. Có thể trình chặn quảng cáo hoặc mạng của bạn đang chặn nó.',
      )
    case 'challenge-failed':
      return t(
        'Verification failed. Please try again.',
        'Xác thực thất bại. Vui lòng thử lại.',
      )
  }
}
</script>

<template>
  <div class="turnstile-modal-overlay">
    <div class="turnstile-modal" role="dialog" aria-modal="true" :aria-label="t('Security Verification', 'Xác thực bảo mật')">
      <button
        class="turnstile-modal-close"
        type="button"
        :aria-label="t('Close', 'Đóng')"
        @click="emit('close')"
      >
        <X :size="20" />
      </button>

      <div class="turnstile-modal-content">
        <h3>{{ t('Security Verification', 'Xác thực bảo mật') }}</h3>

        <template v-if="failure">
          <p class="turnstile-modal-error" role="alert">{{ failureMessage(failure) }}</p>
          <BaseButton v-if="failure !== 'missing-site-key'" @click="retry">
            {{ t('Try again', 'Thử lại') }}
          </BaseButton>
        </template>

        <template v-else>
          <p>{{ t('Please complete the verification below to find a match.', 'Vui lòng hoàn thành xác thực bên dưới để tìm trận.') }}</p>
          <TurnstileWidget
            :key="widgetKey"
            theme="dark"
            action="matchmaking"
            @verify="handleVerify"
            @error="handleError"
            @expire="handleExpire"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.turnstile-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 5, 16, 0.7);
  backdrop-filter: blur(4px);
  animation: fade-in 200ms ease-out;
}

.turnstile-modal {
  position: relative;
  width: 100%;
  max-width: 24rem;
  padding: 1.5rem;
  background:
    linear-gradient(145deg, rgb(30 47 62 / 0.98), rgb(12 25 42 / 0.98));
  border: 1px solid rgb(86 183 255 / 0.3);
  border-radius: var(--radius-lg);
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.6);
  animation: slide-up 200ms ease-out;
}

.turnstile-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  transition: all 150ms;
}

.turnstile-modal-close:hover {
  color: var(--text-foreground);
  background: rgba(255, 255, 255, 0.1);
}

.turnstile-modal-content {
  text-align: center;
}

.turnstile-modal-content h3 {
  margin-bottom: 0.5rem;
  color: var(--text-foreground);
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
}

.turnstile-modal-content p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.turnstile-modal-error {
  color: var(--color-danger, #ff8080);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
