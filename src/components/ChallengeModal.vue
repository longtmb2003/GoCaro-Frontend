<script setup lang="ts">
import { computed } from 'vue'
import { Swords } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useSocialStore } from '@/stores/social'

const social = useSocialStore()

// The modal is not dismissible, so it counts the invitation down itself rather
// than trusting the server's expiry notice to arrive over a live socket.
const expiresAt = computed(() => social.incomingChallenge?.expires_at ?? null)
const { secondsLeft } = useCountdown(expiresAt, () => {
  social.incomingChallenge = null
})
</script>

<template>
  <BaseModal v-if="social.incomingChallenge" :dismissible="false" aria-labelledby="challenge-modal-title">
    <div class="text-center py-2">
      <div class="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3 text-accent">
        <Swords :size="24" aria-hidden="true" />
      </div>
      <h3 id="challenge-modal-title" class="text-section font-bold text-foreground">Match Challenge!</h3>
      <p class="text-foreground-secondary text-body mt-2">
        <span class="font-bold text-accent">{{ social.incomingChallenge.sender_name }}</span> has challenged you to a casual match.
      </p>
      <p class="text-foreground-muted text-caption mt-2" role="timer">
        Expires in {{ secondsLeft }}s
      </p>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <BaseButton variant="primary" class="flex-1 font-bold" @click="social.acceptIncomingChallenge()">
          Accept
        </BaseButton>
        <BaseButton variant="secondary" class="flex-1" @click="social.declineIncomingChallenge()">
          Decline
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
