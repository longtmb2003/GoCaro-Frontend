<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <span class="fantasy-system-icon" :class="{ 'fantasy-system-icon--compact': compact }">
    <slot />
  </span>
</template>

<style scoped>
.fantasy-system-icon {
  position: relative;
  isolation: isolate;
  display: inline-grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-fantasy-gold);
  border: 1px solid color-mix(in srgb, var(--color-fantasy-gold) 38%, transparent);
  border-radius: var(--radius-sm);
  background: linear-gradient(145deg, rgb(34 56 78 / 0.82), rgb(7 20 36 / 0.9));
  box-shadow:
    inset 0 1px 0 rgb(255 248 218 / 0.16),
    inset 0 -2px 4px rgb(0 5 14 / 0.34),
    0 0 0.7rem rgb(86 183 255 / 0.12);
}

.fantasy-system-icon--compact {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
}

.fantasy-system-icon::before,
.fantasy-system-icon::after {
  position: absolute;
  width: 0.3rem;
  height: 0.3rem;
  border-color: color-mix(in srgb, var(--color-fantasy-stone) 62%, transparent);
  content: '';
  pointer-events: none;
}

.fantasy-system-icon::before {
  top: 0.14rem;
  left: 0.14rem;
  border-top: 1px solid;
  border-left: 1px solid;
}

.fantasy-system-icon::after {
  right: 0.14rem;
  bottom: 0.14rem;
  border-right: 1px solid;
  border-bottom: 1px solid;
}

.fantasy-system-icon :deep(svg) {
  width: 1.125rem;
  height: 1.125rem;
  stroke-width: 1.7;
  filter:
    drop-shadow(0 1px 0 rgb(255 255 255 / 0.18))
    drop-shadow(0 0 0.3rem rgb(86 183 255 / 0.42));
}

.fantasy-system-icon--compact :deep(svg) {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
