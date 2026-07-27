<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

import BaseDivider from './BaseDivider.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    /** Renders a header row and names the dialog. Omit for centred dialogs
     *  that supply their own heading and `aria-labelledby`. */
    title?: string
    size?: Size
    /** ESC and overlay click dismiss the dialog. Set false for dialogs the
     *  user must answer (reconnecting, match result, draw offer). */
    dismissible?: boolean
    /** Selector for the control to focus on open. Defaults to the first
     *  focusable element, which for a form dialog is the close button. */
    initialFocus?: string
  }>(),
  { title: '', size: 'sm', dismissible: true, initialFocus: undefined },
)

const emit = defineEmits<{ close: [] }>()

// Attributes belong on the panel, not the overlay, so `aria-describedby` and
// `aria-labelledby` from call sites land on the element with role="dialog".
defineOptions({ inheritAttrs: false })

const SIZES: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-modal',
}

const panel = ref<HTMLElement | null>(null)
const headingId = useId()

useFocusTrap(panel, props.initialFocus)

/**
 * Ref-counted so two dialogs open at once (matchmaking + upgrade are
 * independently mounted) cannot unlock the page while one is still up.
 */
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
    <div
      class="p-lg z-modal fixed inset-0 flex items-center justify-center"
      @keydown="onKeydown"
    >
      <div
        class="bg-background/80 absolute inset-0 backdrop-blur-sm"
        aria-hidden="true"
        @click="requestClose"
      />

      <Transition appear name="modal">
        <!--
          `v-bind="$attrs"` MUST stay last. Vue merges attribute sources in
          source order and later keys win, so binding it first let the
          `aria-labelledby: undefined` below erase the name that title-less
          dialogs pass in themselves.
        -->
        <div
          ref="panel"
          class="bg-surface-3 border-border-strong rounded-modal shadow-modal backdrop-blur-glass p-xl modal-panel custom-scrollbar relative w-full overflow-y-auto border"
          :class="SIZES[size]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title === '' ? undefined : headingId"
          tabindex="-1"
          v-bind="$attrs"
        >
          <template v-if="title !== ''">
            <div class="gap-md mb-lg flex items-center justify-between">
              <h2 :id="headingId" class="text-card text-foreground">{{ title }}</h2>
              <button
                v-if="dismissible"
                type="button"
                class="text-foreground-muted hover:text-foreground hover:bg-glass-light rounded-sm duration-fast -mr-2 flex size-11 shrink-0 items-center justify-center transition"
                @click="emit('close')"
              >
                <span class="sr-only">Close</span>
                <svg
                  class="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BaseDivider class="mb-lg" />
          </template>

          <slot />

          <div v-if="$slots.footer" class="mt-xl">
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
/* MOTION-GUIDE.md: modals fade in and scale 0.96 → 1 over 250ms. */
.modal-enter-active {
  transition:
    opacity 250ms ease-out,
    transform 250ms ease-out;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active {
    transition: none;
  }
}
</style>
