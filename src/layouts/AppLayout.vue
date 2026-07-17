<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="bg-background flex min-h-screen flex-col">
    <header class="border-border-subtle bg-surface border-b">
      <div class="mx-auto flex w-full max-w-6xl items-center px-4 py-4 sm:px-6">
        <h1 class="text-foreground text-lg font-semibold tracking-tight">{{ title }}</h1>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
