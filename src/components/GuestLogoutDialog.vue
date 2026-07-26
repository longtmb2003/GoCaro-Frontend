<script setup lang="ts">
import { onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'

const emit = defineEmits<{ save: []; confirm: []; cancel: [] }>()

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('button')?.focus()
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="guest-logout-heading"
    aria-describedby="guest-logout-description"
    @keydown="onKeydown"
  >
    <div class="bg-surface-elevated w-full max-w-sm rounded-lg p-6 shadow-lg">
      <h2 id="guest-logout-heading" class="text-foreground text-lg font-semibold">
        Log out as a guest?
      </h2>
      <p id="guest-logout-description" class="text-foreground-muted mt-2 text-sm">
        A guest account has no username or password, so there is no way back into this one. Your
        rating and match history are gone for good.
      </p>

      <div class="mt-6 space-y-3">
        <BaseButton class="w-full" @click="emit('save')">Save progress first</BaseButton>
        <BaseButton variant="danger" class="w-full" @click="emit('confirm')">
          Log out anyway
        </BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="emit('cancel')">Cancel</BaseButton>
      </div>
    </div>
  </div>
</template>
