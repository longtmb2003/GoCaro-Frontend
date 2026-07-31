<script setup lang="ts">
import { computed } from 'vue'
import { Swords } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useSocialStore } from '@/stores/social'

const social = useSocialStore()

const expiresAt = computed(() => social.outgoingChallenge?.expires_at ?? null)
const { secondsLeft } = useCountdown(expiresAt, () => {
  social.outgoingChallenge = null
})
</script>

<template>
  <!-- Bottom left, because toasts own the bottom right. -->
  <div
    v-if="social.outgoingChallenge"
    class="bg-surface-3 border-border-strong shadow-floating rounded-card backdrop-blur-glass animate-fade-in z-overlay gap-3 p-4 fixed bottom-6 left-6 flex max-w-xs items-center border"
    role="status"
  >
    <div
      class="text-accent bg-accent/10 border-accent/20 flex size-10 shrink-0 items-center justify-center rounded-full border"
    >
      <Swords :size="18" aria-hidden="true" />
    </div>

    <div class="min-w-0 flex-1">
      <p class="text-foreground text-small truncate font-medium">
        Waiting for {{ social.outgoingChallenge.receiver_name }}
      </p>
      <p class="text-foreground-muted text-caption">Expires in {{ secondsLeft }}s</p>
    </div>

    <BaseButton variant="secondary" size="sm" @click="social.cancelOutgoingChallenge()">
      Cancel
    </BaseButton>
  </div>
</template>
