<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

defineProps<{ secondsLeft: number }>()

const emit = defineEmits<{ leave: [] }>()
</script>

<template>
  <!-- Not dismissible: the match is still live, so leaving must be deliberate. -->
  <BaseModal :dismissible="false" aria-labelledby="reconnecting-heading">
    <div class="text-center">
      <div class="mb-4 flex justify-center">
        <BaseSpinner size="md" />
      </div>

      <h2 id="reconnecting-heading" class="text-card text-foreground">Reconnecting…</h2>
      <p class="text-foreground-muted text-body mt-2" aria-live="polite">
        Your match is still going. Trying to rejoin —
        <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span>
        left before it is lost.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" class="w-full" @click="emit('leave')">
        Leave match
      </BaseButton>
    </template>
  </BaseModal>
</template>
