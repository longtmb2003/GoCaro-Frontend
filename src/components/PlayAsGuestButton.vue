<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import { useGuestLogin } from '@/composables/useGuestLogin'

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const { loading, error, playAsGuest } = useGuestLogin()
</script>

<template>
  <div>
    <BaseButton class="w-full h-12 text-base border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] font-bold" variant="secondary" :loading="loading" :disabled="disabled" @click="playAsGuest">
      Play as guest
    </BaseButton>
    <p class="text-white/50 mt-3 text-center text-xs font-medium tracking-wide">
      Start playing right away. You can save your account later.
    </p>
    <p v-if="error" class="text-danger-400 mt-2 text-center text-sm" role="alert">{{ error }}</p>
  </div>
</template>
