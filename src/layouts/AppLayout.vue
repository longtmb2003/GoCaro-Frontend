<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import RankRulesModal from '@/components/RankRulesModal.vue'

defineProps<{
  title: string
}>()

const showRankRules = ref(false)
</script>

<template>
  <div class="bg-background text-foreground flex min-h-screen flex-col relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute inset-0 pointer-events-none mix-blend-screen opacity-20 z-0" style="background-image: url('/gocaro_bg.png'); background-size: cover; background-position: center; background-attachment: fixed;"></div>
    
    <!-- Animated Glowing Orbs -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/30 blur-[120px] animate-pulse pointer-events-none z-0" style="animation-duration: 8s;"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-600/20 blur-[150px] animate-pulse pointer-events-none z-0" style="animation-duration: 10s; animation-delay: 2s;"></div>
    
    <header class="border-border-subtle bg-surface/70 backdrop-blur-xl border-b sticky top-0 z-50 shadow-sm">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="flex items-center gap-2">
            <img src="/gocaro_logo.png" alt="GoCaro Logo" class="h-8 w-8 rounded object-cover shadow-sm ring-1 ring-white/20" />
            <h1 class="text-foreground text-lg font-semibold tracking-tight">{{ title }}</h1>
          </RouterLink>
        </div>
        <div class="flex items-center gap-3">
          <button class="cursor-pointer text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors bg-primary-500/10 px-3 py-1.5 rounded-full ring-1 ring-primary-500/20 mr-2" @click="showRankRules = true">
            ℹ️ Rank Info
          </button>
          <slot name="actions" />
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 relative z-10">
      <slot />
    </main>

    <footer class="border-border-subtle bg-surface/40 backdrop-blur-md border-t py-6 relative z-10 mt-auto">
      <div class="mx-auto flex w-full max-w-7xl flex-col items-center justify-between px-4 sm:flex-row sm:px-6 gap-4">
        <div class="flex items-center gap-4 text-xs text-foreground-muted">
          <span>&copy; {{ new Date().getFullYear() }} GoCaro</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span class="font-mono text-primary-400">v1.0.0-beta</span>
        </div>
        
        <div class="flex items-center gap-3 text-xs font-mono text-foreground-muted opacity-70">
          <span>Go</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span>Vue 3</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span>WebSocket</span>
          <span class="w-1 h-1 rounded-full bg-border-subtle"></span>
          <span>PostgreSQL</span>
        </div>

        <div class="flex gap-4">
          <a
            href="https://github.com/longtmb2003"
            target="_blank"
            rel="noopener noreferrer"
            class="text-foreground-muted hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            GitHub
          </a>
        </div>
      </div>
    </footer>

    <ToastContainer />
    <RankRulesModal v-if="showRankRules" @close="showRankRules = false" />
  </div>
</template>
