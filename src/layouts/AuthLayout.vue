<script setup lang="ts">
withDefaults(defineProps<{ title: string; subtitle?: string }>(), { subtitle: '' })
</script>

<template>
  <div class="flex min-h-screen bg-background">
    <!-- Form Side -->
    <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[32rem] lg:px-20 xl:px-24 border-r border-border-subtle bg-surface/80 backdrop-blur z-10 shadow-2xl">
      <div class="mx-auto w-full max-w-sm">
        <div class="mb-8 text-center lg:text-left">
          <h1 class="text-foreground text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">{{ title }}</h1>
          <p v-if="subtitle" class="text-foreground-muted mt-2 text-sm">{{ subtitle }}</p>
        </div>

        <div class="border-border-subtle bg-surface rounded-xl border p-6 shadow-sm sm:p-8">
          <slot />
        </div>

        <div v-if="$slots.footer" class="mt-6 text-center">
          <slot name="footer" />
        </div>
      </div>
    </div>

    <!-- Image Side -->
    <div class="relative hidden w-0 flex-1 lg:block overflow-hidden bg-background">
      <img
        class="absolute inset-0 h-full w-full object-contain p-8 opacity-90 transition-transform duration-1000"
        src="/thumbnail.png"
        alt="GoCaro Cover"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-background/90 mix-blend-multiply pointer-events-none"></div>
      <!-- Premium Glassmorphic Badge -->
      <div class="absolute bottom-12 right-12 backdrop-blur-md bg-surface/30 border border-white/10 p-6 rounded-2xl shadow-2xl">
        <h2 class="text-white text-2xl font-bold tracking-wider">Multiplayer Gomoku</h2>
        <p class="text-white/70 text-sm mt-1">Real-time competitive matches</p>
      </div>
    </div>
  </div>
</template>
