<script setup lang="ts">
withDefaults(defineProps<{ title: string; subtitle?: string }>(), { subtitle: '' })
</script>

<template>
  <div class="flex min-h-screen bg-background">
    <!-- Form Side -->
    <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[32rem] lg:px-20 xl:px-24 border-r border-border-subtle bg-gradient-to-br from-surface/90 to-background backdrop-blur z-10 shadow-2xl">
      <div class="mx-auto w-full max-w-sm">
        <div class="mb-8 text-center lg:text-left relative">
          <!-- Logo glow effect -->
          <div class="absolute -top-12 -left-12 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
          
          <h1 class="text-foreground text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 relative z-10">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-foreground-muted mt-3 text-sm leading-relaxed relative z-10">{{ subtitle }}</p>
        </div>

        <div class="border-border-subtle bg-surface rounded-xl border p-6 shadow-sm sm:p-8">
          <slot />
        </div>

        <div v-if="$slots.footer" class="mt-6 text-center relative z-10">
          <slot name="footer" />
        </div>
        
        <div class="mt-12 pt-6 border-t border-border-subtle/50 flex items-center justify-between text-xs text-foreground-muted relative z-10">
          <span class="font-medium tracking-wider">v1.0.0</span>
          <div class="flex items-center gap-3">
            <a href="#" class="hover:text-primary-400 transition-colors">GitHub</a>
            <span>•</span>
            <a href="#" class="hover:text-primary-400 transition-colors">Terms</a>
            <span>•</span>
            <a href="#" class="hover:text-primary-400 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Side -->
    <div class="relative hidden w-0 flex-1 lg:block overflow-hidden bg-background">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-background to-secondary-900/10 z-0"></div>
      
      <!-- Animated Board Shine -->
      <div class="absolute inset-0 opacity-30 z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-15deg] [animation:light-sweep_4s_infinite]"></div>
      
      <img
        class="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-1000 z-10 [animation:float_6s_ease-in-out_infinite]"
        src="/thumbnail.png"
        alt="GoCaro Cover"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-background/90 mix-blend-multiply pointer-events-none z-20"></div>
      
      <!-- Premium Glassmorphic Badge -->
      <div class="absolute bottom-12 right-12 backdrop-blur-md bg-surface/30 border border-white/10 p-6 rounded-2xl shadow-2xl z-30 group hover:bg-surface/40 transition-colors">
        <div class="absolute -top-3 -right-3">
          <div class="flex items-center gap-1.5 bg-success-500/20 border border-success-500/30 text-success-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse"></span>
            Server Online
          </div>
        </div>
        <h2 class="text-white text-2xl font-bold tracking-wider group-hover:text-primary-300 transition-colors">GOCARO</h2>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-white/70 text-xs font-semibold tracking-wide uppercase">Realtime Multiplayer</span>
          <span class="w-1 h-1 rounded-full bg-white/30"></span>
          <span class="text-white/70 text-xs font-semibold tracking-wide uppercase">Cross Platform</span>
        </div>
      </div>
      
      <div class="absolute top-12 left-12 z-30">
        <div class="inline-block bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          Latest Update: Season 1
        </div>
      </div>
    </div>
  </div>
</template>
