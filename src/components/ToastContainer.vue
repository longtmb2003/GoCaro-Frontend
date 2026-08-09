<script setup lang="ts">
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-vue-next'

import { useToast } from '@/composables/useToast'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { toasts, removeToast } = useToast()
const { t } = useAppLanguage()
</script>

<template>
  <div class="fixed bottom-6 right-6 z-1400 flex flex-col gap-3">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card flex items-center justify-between gap-4 px-4 py-3 rounded-lg shadow-floating border cursor-pointer min-w-[280px]"
        :class="{
          'bg-surface-elevated border-success-500/30 shadow-success-500/10': toast.type === 'success',
          'bg-surface-elevated border-danger-500/30 shadow-danger-500/10': toast.type === 'error',
          'bg-surface-elevated border-border shadow-black/20': toast.type === 'info',
        }"
        @click="removeToast(toast.id)"
      >
        <div class="flex items-center gap-3">
          <CircleCheck
            v-if="toast.type === 'success'"
            class="text-success-400"
            :size="20"
            aria-hidden="true"
          />
          <TriangleAlert
            v-if="toast.type === 'error'"
            class="text-danger-400"
            :size="20"
            aria-hidden="true"
          />
          <Info v-if="toast.type === 'info'" class="text-primary-400" :size="20" aria-hidden="true" />
          <p class="text-sm font-medium text-foreground">{{ toast.message }}</p>
        </div>
        <button class="text-foreground-muted hover:text-foreground">
          <span class="sr-only">{{ t('Dismiss notification', 'Đóng thông báo') }}</span>
          <FantasySystemIcon compact><X :size="20" aria-hidden="true" /></FantasySystemIcon>
        </button>
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
