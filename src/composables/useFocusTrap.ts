import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Confines Tab to `container` for as long as the component is mounted, then
 * hands focus back to whatever had it before.
 *
 * A dialog that only sets initial focus is not accessible: without this, Tab
 * walks straight out of the overlay into the page behind it.
 */
export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  /**
   * Selector for the control that should hold focus on open. Falls back to the
   * first focusable element, which is rarely what a form dialog wants.
   */
  initialFocusSelector?: string,
): void {
  let previouslyFocused: HTMLElement | null = null

  function focusableItems(): HTMLElement[] {
    const root = container.value
    if (root === null) {
      return []
    }
    // `offsetParent` is null for anything display:none, which keeps hidden
    // controls (collapsed panels, `v-show`n blocks) out of the cycle.
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => element.offsetParent !== null,
    )
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return
    }

    const items = focusableItems()
    const first = items[0]
    const last = items[items.length - 1]

    // Nothing focusable inside: keep focus on the panel rather than letting it
    // escape to the page behind the overlay.
    if (first === undefined || last === undefined) {
      event.preventDefault()
      container.value?.focus()
      return
    }

    const active = document.activeElement
    if (event.shiftKey && (active === first || active === container.value)) {
      event.preventDefault()
      last.focus()
      return
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function initialTarget(): HTMLElement | null {
    if (initialFocusSelector !== undefined) {
      const requested = container.value?.querySelector<HTMLElement>(initialFocusSelector)
      if (requested != null) {
        return requested
      }
    }
    return focusableItems()[0] ?? container.value
  }

  onMounted(() => {
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    initialTarget()?.focus()
    document.addEventListener('keydown', onKeydown, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown, true)
    previouslyFocused?.focus()
  })
}
