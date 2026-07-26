<script setup lang="ts">
import { RouterLink } from 'vue-router'
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="bg-background flex min-h-screen flex-col relative">
    <div class="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen" style="background-image: url('/gocaro_bg.png'); background-size: cover; background-position: center; background-attachment: fixed; z-index: 0;"></div>
    <header class="border-border-subtle bg-surface/80 backdrop-blur-md border-b sticky top-0 z-10">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="flex items-center gap-2">
            <img src="/gocaro_logo.png" alt="GoCaro Logo" class="h-8 w-8 rounded object-cover shadow-sm ring-1 ring-white/20" />
            <h1 class="text-foreground text-lg font-semibold tracking-tight">{{ title }}</h1>
          </RouterLink>
        </div>
        <div class="flex items-center gap-3">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 relative z-10">
      <slot />
    </main>
  </div>
</template>
