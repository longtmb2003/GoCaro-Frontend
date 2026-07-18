<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  username: string
  elo: number
}>()

const initial = computed(() => props.username.charAt(0).toUpperCase())
</script>

<template>
  <section
    class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm"
    aria-label="Your profile"
  >
    <div class="flex items-center gap-4">
      <div
        class="bg-primary-600 flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
        aria-hidden="true"
      >
        {{ initial }}
      </div>
      <div class="min-w-0">
        <p class="text-foreground truncate text-lg font-semibold">{{ username }}</p>
        <p class="text-foreground-muted text-sm">Signed in</p>
      </div>
    </div>

    <dl class="border-border-subtle mt-6 border-t pt-4">
      <div class="flex items-baseline justify-between">
        <dt class="text-foreground-muted text-sm font-medium">Rating</dt>
        <dd class="text-foreground text-2xl font-semibold tabular-nums">{{ elo }}</dd>
      </div>
    </dl>
  </section>
</template>
