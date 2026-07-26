<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="fixed bottom-6 right-6 z-1400 flex flex-col gap-3">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card flex items-center justify-between gap-4 px-4 py-3 rounded-lg shadow-xl border cursor-pointer min-w-[280px]"
        :class="{
          'bg-surface-elevated border-success-500/30 shadow-success-500/10': toast.type === 'success',
          'bg-surface-elevated border-danger-500/30 shadow-danger-500/10': toast.type === 'error',
          'bg-surface-elevated border-border shadow-black/20': toast.type === 'info',
        }"
        @click="removeToast(toast.id)"
      >
        <div class="flex items-center gap-3">
          <span v-if="toast.type === 'success'" class="text-success-400 text-lg">✓</span>
          <span v-if="toast.type === 'error'" class="text-danger-400 text-lg">⚠</span>
          <span v-if="toast.type === 'info'" class="text-primary-400 text-lg">ℹ</span>
          <p class="text-sm font-medium text-foreground">{{ toast.message }}</p>
        </div>
        <button class="text-foreground-muted hover:text-foreground">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
