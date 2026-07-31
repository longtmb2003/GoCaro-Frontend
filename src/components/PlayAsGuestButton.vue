<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import { useGuestLogin } from '@/composables/useGuestLogin'

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const { loading, error, playAsGuest } = useGuestLogin()
</script>

<template>
  <div>
    <BaseButton class="w-full" size="lg" variant="secondary" :loading="loading" :disabled="disabled" @click="playAsGuest">
      Play as guest
    </BaseButton>
    <p class="text-white/50 mt-3 text-center text-xs font-medium tracking-wide">
      Start playing right away. You can save your account later.
    </p>
    <p v-if="error" class="text-danger-400 mt-2 text-center text-sm" role="alert">{{ error }}</p>
  </div>
</template>
