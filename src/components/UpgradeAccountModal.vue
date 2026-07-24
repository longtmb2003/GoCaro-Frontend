<script setup lang="ts">
import { onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import CredentialsForm from '@/components/CredentialsForm.vue'
import type { Credentials } from '@/types/auth'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    serverError?: string
  }>(),
  {
    loading: false,
    serverError: '',
  },
)

const emit = defineEmits<{ submit: [credentials: Credentials]; close: [] }>()

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('input')?.focus()
})

/**
 * Closing while the request is in flight would hide a rename that is still
 * going to land, so the dialog stays put until it settles either way.
 */
function requestClose(): void {
  if (props.loading) {
    return
  }
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    requestClose()
  }
}
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="upgrade-heading"
    aria-describedby="upgrade-description"
    @keydown="onKeydown"
  >
    <div class="bg-surface-elevated w-full max-w-sm rounded-lg p-6 shadow-lg">
      <h2 id="upgrade-heading" class="text-foreground text-lg font-semibold">Save your progress</h2>
      <p id="upgrade-description" class="text-foreground-muted mt-1 mb-5 text-sm">
        Pick a username and password. Your rating and match history stay exactly as they are.
      </p>

      <CredentialsForm
        submit-label="Save account"
        password-autocomplete="new-password"
        :loading="loading"
        :server-error="serverError"
        @submit="emit('submit', $event)"
      />

      <BaseButton
        variant="secondary"
        class="mt-3 w-full"
        :disabled="loading"
        @click="requestClose"
      >
        Cancel
      </BaseButton>
    </div>
  </div>
</template>
