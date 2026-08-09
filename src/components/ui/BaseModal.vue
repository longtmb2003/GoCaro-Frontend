<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { X } from 'lucide-vue-next'

import BaseDivider from './BaseDivider.vue'
import FantasySystemIcon from './FantasySystemIcon.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useAppLanguage } from '@/composables/useAppLanguage'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'default' | 'fantasy'

const props = withDefaults(
  defineProps<{
    /** Renders a header row and names the dialog. Omit for centred dialogs
     *  that supply their own heading and `aria-labelledby`. */
    title?: string
    size?: Size
    /** Selects the visual shell without changing modal behaviour. */
    variant?: Variant
    /** ESC and overlay click dismiss the dialog. Set false for dialogs the
     *  user must answer (reconnecting, match result, draw offer). */
    dismissible?: boolean
    /** Selector for the control to focus on open. Defaults to the first
     *  focusable element, which for a form dialog is the close button. */
    initialFocus?: string
  }>(),
  { title: '', size: 'sm', variant: 'default', dismissible: true, initialFocus: undefined },
)

const emit = defineEmits<{ close: [] }>()
const { t } = useAppLanguage()

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
    <div class="p-4 z-modal fixed inset-0 flex items-center justify-center" @keydown="onKeydown">
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
        <div class="relative w-full" :class="SIZES[size]">
          <div
            ref="panel"
            class="bg-surface-3 border-border-strong rounded-modal shadow-modal backdrop-blur-glass modal-panel relative w-full border flex flex-col"
            style="max-height: calc(100vh - 2rem);"
            :data-modal-variant="variant"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title === '' ? undefined : headingId"
            tabindex="-1"
            v-bind="$attrs"
          >
          <template v-if="variant === 'fantasy'">
            <span class="fantasy-modal__aura" aria-hidden="true" />
            <span class="fantasy-modal__engraving" aria-hidden="true" />
            <span
              class="fantasy-modal__corner fantasy-modal__corner--top-left"
              aria-hidden="true"
            />
            <span
              class="fantasy-modal__corner fantasy-modal__corner--top-right"
              aria-hidden="true"
            />
            <span
              class="fantasy-modal__corner fantasy-modal__corner--bottom-left"
              aria-hidden="true"
            />
            <span
              class="fantasy-modal__corner fantasy-modal__corner--bottom-right"
              aria-hidden="true"
            />
            <span class="fantasy-modal__crystal" aria-hidden="true" />
          </template>

          <template v-if="title !== ''">
              <div class="px-4 pt-4 pb-0 sm:px-6 sm:pt-6 shrink-0 relative z-10">
                <div
                  class="gap-3 mb-4 flex items-center justify-between"
                  :class="{ 'fantasy-modal__header': variant === 'fantasy' }"
                >
                  <span
                    v-if="variant === 'fantasy'"
                    class="fantasy-modal__divider"
                    aria-hidden="true"
                  />
                  <h2
                    :id="headingId"
                    class="text-card text-foreground"
                    :class="{ 'fantasy-modal__title': variant === 'fantasy' }"
                  >
                    {{ title }}
                  </h2>
                  <span
                    v-if="variant === 'fantasy'"
                    class="fantasy-modal__divider"
                    aria-hidden="true"
                  />
                </div>
                <BaseDivider v-if="variant !== 'fantasy'" class="mb-4" />
              </div>
            </template>

            <div class="custom-scrollbar overflow-y-auto w-full flex-1 min-h-0 p-4 sm:p-6" :class="{ 'pt-0 sm:pt-0': title !== '' }" style="isolation: isolate;">
              <slot />

              <div v-if="$slots.footer" class="mt-6">
                <slot name="footer" />
              </div>
            </div>
          </div>

          <!-- Out-of-panel Close Button -->
          <button
            v-if="dismissible"
            type="button"
            class="modal-close-floating flex items-center justify-center transition"
            :class="variant === 'fantasy' ? 'fantasy-modal__close--floating' : 'default-modal__close--floating'"
            @click="emit('close')"
          >
            <span class="sr-only">{{ t('Close', 'Đóng') }}</span>
            <FantasySystemIcon v-if="variant === 'fantasy'" compact><X :size="20" aria-hidden="true" /></FantasySystemIcon>
            <X v-else :size="20" aria-hidden="true" />
          </button>
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

.modal-panel[data-modal-variant='fantasy'] {
  isolation: isolate;
  overflow-x: hidden;
  color: var(--color-fantasy-stone);
  border-color: color-mix(in srgb, var(--color-rank-gold) 54%, transparent);
  border-radius: var(--radius-modal);
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in srgb, var(--color-rank-diamond) 13%, transparent),
      transparent 34%
    ),
    radial-gradient(circle at 50% 50%, transparent 48%, rgb(0 4 14 / 0.38) 100%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--color-rank-panel) 94%, white),
      var(--color-rank-panel-deep)
    );
  box-shadow:
    0 0 2rem color-mix(in srgb, var(--color-rank-diamond) 15%, transparent),
    var(--shadow-modal),
    inset 0 1px 0 color-mix(in srgb, var(--color-rank-gold-warm) 22%, transparent),
    inset 0 0 3rem rgb(0 4 14 / 0.44);
  clip-path: polygon(
    0 var(--radius-modal),
    var(--radius-modal) 0,
    calc(100% - var(--radius-modal)) 0,
    100% var(--radius-modal),
    100% calc(100% - var(--radius-modal)),
    calc(100% - var(--radius-modal)) 100%,
    var(--radius-modal) 100%,
    0 calc(100% - var(--radius-modal))
  );
  scrollbar-color: var(--color-rank-gold)
    color-mix(in srgb, var(--color-rank-panel-deep) 86%, transparent);
}

.modal-panel[data-modal-variant='fantasy']::before {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-image:
    repeating-radial-gradient(
      circle at 17% 31%,
      rgb(255 255 255 / 0.035) 0 1px,
      transparent 1px 4px
    ),
    linear-gradient(112deg, transparent 20%, rgb(255 255 255 / 0.035) 47%, transparent 70%);
  background-size:
    7rem 6rem,
    100% 100%;
  content: '';
  opacity: 0.34;
  pointer-events: none;
}

.modal-panel[data-modal-variant='fantasy']::-webkit-scrollbar {
  width: 0.375rem;
}

.modal-panel[data-modal-variant='fantasy']::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--color-rank-panel-deep) 86%, transparent);
  border-radius: var(--radius-pill);
}

.modal-panel[data-modal-variant='fantasy']::-webkit-scrollbar-thumb {
  border-radius: var(--radius-pill);
  background: linear-gradient(var(--color-rank-gold-warm), var(--color-rank-gold));
  box-shadow: 0 0 0.5rem color-mix(in srgb, var(--color-rank-diamond) 34%, transparent);
}

.modal-panel[data-modal-variant='fantasy']::-webkit-scrollbar-thumb:active {
  box-shadow: 0 0 0.85rem color-mix(in srgb, var(--color-rank-diamond) 70%, transparent);
}

.fantasy-modal__aura,
.fantasy-modal__engraving {
  position: absolute;
  pointer-events: none;
}

.fantasy-modal__aura {
  inset: 0.25rem;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--color-rank-gold-warm) 26%, transparent);
  border-radius: calc(var(--radius-modal) - 0.25rem);
  box-shadow: inset 0 0 1rem color-mix(in srgb, var(--color-rank-diamond) 8%, transparent);
}

.fantasy-modal__engraving {
  inset: 0.5rem;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--color-rank-gold) 16%, transparent);
  clip-path: inherit;
}

.fantasy-modal__corner {
  position: absolute;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  border-color: var(--color-rank-gold);
  filter: drop-shadow(0 0 0.35rem color-mix(in srgb, var(--color-rank-diamond) 28%, transparent));
  pointer-events: none;
}

.fantasy-modal__corner::after {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid var(--color-rank-gold-warm);
  background: var(--color-rank-panel-deep);
  content: '';
  transform: rotate(45deg);
}

.fantasy-modal__corner--top-left {
  top: 0.5rem;
  left: 0.5rem;
  border-top: 2px solid;
  border-left: 2px solid;
}
.fantasy-modal__corner--top-left::after {
  top: -0.25rem;
  left: -0.25rem;
}
.fantasy-modal__corner--top-right {
  top: 0.5rem;
  right: 0.5rem;
  border-top: 2px solid;
  border-right: 2px solid;
}
.fantasy-modal__corner--top-right::after {
  top: -0.25rem;
  right: -0.25rem;
}
.fantasy-modal__corner--bottom-left {
  bottom: 0.5rem;
  left: 0.5rem;
  border-bottom: 2px solid;
  border-left: 2px solid;
}
.fantasy-modal__corner--bottom-left::after {
  bottom: -0.25rem;
  left: -0.25rem;
}
.fantasy-modal__corner--bottom-right {
  right: 0.5rem;
  bottom: 0.5rem;
  border-right: 2px solid;
  border-bottom: 2px solid;
}
.fantasy-modal__corner--bottom-right::after {
  right: -0.25rem;
  bottom: -0.25rem;
}

.fantasy-modal__crystal {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  z-index: 3;
  width: 0.75rem;
  height: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--color-rank-gold-warm) 70%, white);
  background: linear-gradient(
    135deg,
    white,
    var(--color-rank-diamond) 38%,
    var(--color-primary-700)
  );
  box-shadow: 0 0 0.85rem color-mix(in srgb, var(--color-rank-diamond) 70%, transparent);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  content: '';
  transform: translateX(-50%);
  animation: fantasy-crystal-pulse 3s ease-in-out infinite;
}

.fantasy-modal__header {
  position: relative;
  min-height: 3rem;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  padding-inline: 3rem;
  justify-content: center;
}

.fantasy-modal__title {
  flex: 0 0 auto;
  color: var(--color-rank-gold-warm);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-section);
  line-height: var(--text-section--line-height);
  letter-spacing: 0.06em;
  text-align: center;
  text-shadow:
    0 1px 0 rgb(0 0 0 / 0.9),
    0 -1px 0 color-mix(in srgb, var(--color-rank-gold-warm) 24%, white),
    0 0 0.8rem color-mix(in srgb, var(--color-rank-gold) 28%, transparent);
}

.fantasy-modal__divider {
  width: min(22%, 5rem);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-rank-gold), transparent);
  box-shadow: 0 0 0.45rem color-mix(in srgb, var(--color-rank-diamond) 20%, transparent);
}

.fantasy-modal__divider:first-child {
  transform: rotate(180deg);
}

.modal-close-floating {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  z-index: 50;
}

.fantasy-modal__close--floating {
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-rank-gold-warm);
  border: 1px solid var(--color-rank-gold);
  border-radius: var(--radius-pill);
  background: radial-gradient(
    circle at 50% 35%,
    var(--color-rank-panel),
    var(--color-rank-panel-deep)
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-rank-gold-warm) 24%, transparent),
    inset 0 -2px 0 rgb(0 0 0 / 0.35),
    0 0 0 2px color-mix(in srgb, var(--color-rank-gold) 12%, transparent),
    0 4px 12px rgba(0,0,0,0.5);
}

.fantasy-modal__close--floating :deep(.fantasy-system-icon) {
  border: 0;
  background: transparent;
  box-shadow: none;
  transition: transform var(--transition-duration-normal) ease-out;
}

.fantasy-modal__close--floating:hover,
.fantasy-modal__close--floating:focus-visible {
  transform: scale(1.05);
  color: var(--color-rank-gold-warm);
  border-color: var(--color-rank-gold-warm);
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-rank-diamond) 18%, var(--color-rank-panel)),
    var(--color-rank-panel-deep)
  );
  box-shadow:
    0 0 1rem color-mix(in srgb, var(--color-rank-diamond) 42%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-rank-gold-warm) 32%, transparent),
    0 4px 12px rgba(0,0,0,0.5);
}

.fantasy-modal__close--floating:hover :deep(.fantasy-system-icon) {
  transform: rotate(20deg);
}

.default-modal__close--floating {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-foreground-muted);
  background: var(--surface-glass-strong);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-floating);
}
.default-modal__close--floating:hover {
  color: var(--color-foreground);
  background: var(--surface-sunken);
}

@keyframes fantasy-crystal-pulse {
  0%,
  100% {
    opacity: 0.72;
    filter: brightness(0.9);
  }
  50% {
    opacity: 1;
    filter: brightness(1.18);
  }
}

@media (max-width: 39.99rem) {
  .fantasy-modal__header {
    padding-inline: 2.5rem;
  }
  .fantasy-modal__divider {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active {
    transition: none;
  }

  .fantasy-modal__crystal {
    animation: none;
  }

  .fantasy-modal__close--floating :deep(.fantasy-system-icon) {
    transition: none;
  }

  .fantasy-modal__close--floating:hover :deep(.fantasy-system-icon) {
    transform: none;
  }
}
</style>
