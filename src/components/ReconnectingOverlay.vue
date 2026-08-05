<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

defineProps<{
  secondsLeft: number
  state: 'reconnecting' | 'failed'
}>()

const emit = defineEmits<{ leave: []; retry: [] }>()
</script>

<template>
  <!-- Not dismissible: the match is still live, so leaving must be deliberate. -->
  <BaseModal :dismissible="false" aria-labelledby="reconnecting-heading">
    <div class="text-center">
      <div v-if="state === 'reconnecting'" class="mb-4 flex justify-center">
        <BaseSpinner size="md" />
      </div>

      <h2 id="reconnecting-heading" class="text-card text-foreground">
        {{ state === 'reconnecting' ? 'Reconnecting…' : 'Connection lost' }}
      </h2>
      <p
        v-if="state === 'reconnecting'"
        class="text-foreground-muted text-body mt-2"
        aria-live="polite"
      >
        Your match is still going. Trying to rejoin —
        <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span> remaining.
      </p>
      <p v-else class="text-foreground-muted text-body mt-2" role="alert">
        The automatic reconnect did not succeed. You can try connecting again or leave the match.
      </p>
    </div>

    <template #footer>
      <BaseButton v-if="state === 'failed'" class="w-full" @click="emit('retry')">
        Try reconnecting
      </BaseButton>
      <BaseButton variant="secondary" class="w-full" @click="emit('leave')">
        Leave match
      </BaseButton>
    </template>
  </BaseModal>
</template>
