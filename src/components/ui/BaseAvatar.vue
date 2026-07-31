<script setup lang="ts">
import { computed } from 'vue'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
  defineProps<{
    /** Display name — the first character becomes the fallback initial. */
    name: string
    size?: Size
    online?: boolean
  }>(),
  { size: 'md', online: false },
)

const SIZES: Record<Size, string> = {
  xs: 'size-6 text-caption',
  sm: 'size-8 text-caption',
  md: 'size-10 text-small',
  lg: 'size-14 text-card',
  xl: 'size-20 text-page',
}

const DOT_SIZES: Record<Size, string> = {
  xs: 'size-2',
  sm: 'size-3',
  md: 'size-3',
  lg: 'size-4',
  xl: 'size-5',
}

const initial = computed(() => props.name.charAt(0).toUpperCase())
</script>

<template>
  <span class="relative inline-flex shrink-0">
    <span
      class="from-primary-500 to-secondary-600 ring-border-strong inline-flex items-center justify-center rounded-pill bg-gradient-to-br font-bold text-white ring-2"
      :class="SIZES[size]"
      aria-hidden="true"
    >
      {{ initial }}
    </span>
    <span
      v-if="online"
      class="bg-success ring-background absolute -right-0.5 -bottom-0.5 rounded-pill ring-2"
      :class="DOT_SIZES[size]"
      aria-hidden="true"
    />
  </span>
</template>
