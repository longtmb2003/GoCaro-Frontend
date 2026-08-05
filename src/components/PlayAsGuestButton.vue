<script setup lang="ts">
import { DoorOpen } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import { useGuestLogin } from '@/composables/useGuestLogin'

withDefaults(
  defineProps<{
    disabled?: boolean
    compact?: boolean
    compactLabel?: string
    compactBadge?: string
  }>(),
  {
    disabled: false,
    compact: false,
    compactLabel: 'Enter as guest',
    compactBadge: 'No account needed',
  },
)

const { loading, error, playAsGuest } = useGuestLogin()
</script>

<template>
  <div>
    <BaseButton
      class="w-full"
      :class="{ 'guest-button': compact }"
      :size="compact ? 'md' : 'lg'"
      variant="secondary"
      :loading="loading"
      :disabled="disabled"
      @click="playAsGuest"
    >
      <DoorOpen v-if="compact" :size="18" aria-hidden="true" />
      <span>{{ compact ? compactLabel : 'Play as guest' }}</span>
      <span v-if="compact" class="guest-badge">{{ compactBadge }}</span>
    </BaseButton>
    <p v-if="!compact" class="text-white/50 mt-3 text-center text-xs font-medium tracking-wide">
      Start playing right away. You can save your account later.
    </p>
    <p v-if="error" class="text-danger-400 mt-2 text-center text-sm" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.guest-button {
  border-color: color-mix(in srgb, var(--color-accent) 38%, var(--color-border));
  background:
    linear-gradient(105deg, var(--color-accent-soft), var(--color-player-o-soft)),
    var(--color-glass-strong);
  color: var(--color-foreground);
  box-shadow:
    0 0 22px color-mix(in srgb, var(--color-accent-glow) 65%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 0.09);
}

.guest-button:hover:not(:disabled) {
  border-color: var(--color-accent);
  background:
    linear-gradient(105deg, var(--color-accent-soft), var(--color-player-o-soft)),
    var(--color-surface-3);
}

.guest-badge {
  margin-left: auto;
  padding: calc(var(--spacing) * 1) calc(var(--spacing) * 2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-primary-100);
  background: rgb(255 255 255 / 0.06);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (max-width: 390px) {
  .guest-badge {
    display: none;
  }
}
</style>
