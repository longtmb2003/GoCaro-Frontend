<script setup lang="ts">
withDefaults(defineProps<{ title: string; subtitle?: string }>(), { subtitle: '' })
</script>

<template>
  <div class="bg-background flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <h1 class="text-foreground text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="text-foreground-muted mt-1 text-sm">{{ subtitle }}</p>
      </div>

      <div class="border-border-subtle bg-surface rounded-lg border p-6 shadow-md sm:p-8">
        <slot />
      </div>

      <div v-if="$slots.footer" class="mt-6 text-center">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
