<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

defineProps<{
  tournamentName: string
}>()
</script>

<template>
  <BaseModal @close="emit('close')" aria-labelledby="champion-banner-title">
    <!-- CSS Glow Effect Background -->
    <div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none rounded-xl">
      <div class="absolute inset-0 bg-warning/10" />
      <div
        class="bg-warning/20 absolute -inset-[100%] animate-[spin_10s_linear_infinite]"
        style="background: conic-gradient(from 0deg, transparent 0 340deg, theme('colors.warning.DEFAULT') 360deg);"
      />
    </div>

    <div class="text-center py-8 px-4 flex flex-col items-center">
      <div class="bg-warning/20 text-warning rounded-full p-6 mb-6 shadow-[0_0_40px_rgba(234,179,8,0.5)]">
        <Trophy :size="64" aria-hidden="true" />
      </div>
      
      <h2 id="champion-banner-title" class="text-3xl font-black text-foreground mb-2 tracking-tight">
        You are the Champion!
      </h2>
      
      <p class="text-foreground-muted mb-8 max-w-sm">
        Congratulations on winning the <strong class="text-foreground font-semibold">{{ tournamentName }}</strong> tournament.
      </p>

      <BaseButton variant="primary" size="lg" @click="emit('close')" autofocus>
        Close
      </BaseButton>
    </div>
  </BaseModal>
</template>
