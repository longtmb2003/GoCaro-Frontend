<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { X } from 'lucide-vue-next'

import FantasySystemIcon from './FantasySystemIcon.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = withDefaults(
  defineProps<{
    title?: string
    dismissible?: boolean
    initialFocus?: string
  }>(),
  { title: '', dismissible: true, initialFocus: undefined },
)

const emit = defineEmits<{ close: [] }>()
const { t } = useAppLanguage()

defineOptions({ inheritAttrs: false })

const panel = ref<HTMLElement | null>(null)
const headingId = useId()

useFocusTrap(panel, props.initialFocus)

let locked = false
onMounted(() => {
  if (typeof document === 'undefined') return
  const count = Number(document.body.dataset['modalCount'] ?? '0') + 1
  document.body.dataset['modalCount'] = count.toString()
  document.body.style.overflow = 'hidden'
  locked = true
})

onBeforeUnmount(() => {
  if (!locked) return
  const count = Math.max(0, Number(document.body.dataset['modalCount'] ?? '1') - 1)
  document.body.dataset['modalCount'] = count.toString()
  if (count === 0) {
    document.body.style.overflow = ''
    delete document.body.dataset['modalCount']
  }
})

function requestClose(): void {
  if (props.dismissible) {
    emit('close')
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    requestClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="z-modal fixed inset-0 flex justify-end items-end md:items-stretch" @keydown="onKeydown">
      <div
        class="bg-background/80 absolute inset-0 backdrop-blur-sm"
        aria-hidden="true"
        @click="requestClose"
      />

      <Transition appear name="drawer">
        <div
          ref="panel"
          class="bg-slate-950/95 border-t border-[var(--color-fantasy-border-subtle)] md:border-t-0 md:border-l backdrop-blur-2xl shadow-2xl drawer-panel custom-scrollbar relative flex w-full flex-col overflow-y-auto sm:max-w-md md:max-w-[400px]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title === '' ? undefined : headingId"
          tabindex="-1"
          v-bind="$attrs"
        >
          <!-- Cố định Header để vùng dưới scroll -->
          <div v-if="title !== ''" class="sticky top-0 z-10 bg-slate-950/90 p-4 backdrop-blur pb-2 border-b border-[var(--color-fantasy-border-subtle)]">
            <div class="gap-3 mb-1 flex items-center justify-between">
              <h2 :id="headingId" class="font-serif text-lg font-bold text-[var(--color-fantasy-stone)] tracking-wide">{{ title }}</h2>
              <button
                v-if="dismissible"
                type="button"
                class="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-1.5 duration-fast transition"
                @click="emit('close')"
              >
                <span class="sr-only">{{ t('Close', 'Đóng') }}</span>
                <FantasySystemIcon compact><X :size="18" aria-hidden="true" /></FantasySystemIcon>
              </button>
            </div>
          </div>

          <!-- Nội dung cuộn được -->
          <div class="p-4 pt-2 flex-1 flex flex-col min-h-0">
            <slot />
          </div>

          <!-- Cố định Footer -->
          <div v-if="$slots.footer" class="sticky bottom-0 z-10 bg-surface-3/95 p-4 border-border-strong backdrop-blur border-t">
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
/* Mobile: Slide from bottom (100% Y) */
.drawer-enter-from {
  transform: translateY(100%);
}

.drawer-enter-active {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-leave-active {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-leave-to {
  transform: translateY(100%);
}

/* Desktop: Slide from right (100% X) */
@media (min-width: 768px) {
  .drawer-enter-from {
    transform: translateX(100%);
  }
  .drawer-leave-to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active {
    transition: none;
  }
}
</style>
