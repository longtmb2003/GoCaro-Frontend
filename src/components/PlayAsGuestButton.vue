<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import { useGuestLogin } from '@/composables/useGuestLogin'

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const { loading, error, playAsGuest } = useGuestLogin()
</script>

<template>
  <div>
    <BaseButton class="w-full h-12 text-base" variant="secondary" :loading="loading" :disabled="disabled" @click="playAsGuest">
      Play as guest
    </BaseButton>
    <p class="text-foreground-muted mt-2 text-center text-xs">
      Start playing right away. You can save your account later.
    </p>
    <p v-if="error" class="text-danger-400 mt-2 text-center text-sm" role="alert">{{ error }}</p>
  </div>
</template>
