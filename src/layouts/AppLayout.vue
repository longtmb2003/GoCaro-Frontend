<script setup lang="ts">
import { ref } from 'vue'
import { Github, Info } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import RankRulesModal from '@/components/RankRulesModal.vue'
import ChallengeModal from '@/components/ChallengeModal.vue'
import OutgoingChallengeCard from '@/components/OutgoingChallengeCard.vue'

defineProps<{
  title: string
}>()

const showRankRules = ref(false)
</script>

<template>
  <div class="bg-background text-foreground flex min-h-screen flex-col relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute inset-0 pointer-events-none mix-blend-screen opacity-20 z-0" style="background-image: url('/gocaro_bg.webp'); background-size: cover; background-position: center; background-attachment: fixed;"></div>
    
    <!-- Animated Glowing Orbs -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/30 blur-[120px] animate-pulse pointer-events-none z-0" style="animation-duration: 8s;"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-600/20 blur-[150px] animate-pulse pointer-events-none z-0" style="animation-duration: 10s; animation-delay: 2s;"></div>
    
    <!-- Header -->
    <header class="bg-black/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-50">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 h-16 sm:px-6">
        <div class="flex items-center gap-6">
          <RouterLink to="/" class="flex items-center gap-2 group">
            <div class="relative w-8 h-8 rounded overflow-hidden ring-1 ring-white/20 group-hover:ring-primary-500/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(45,212,191,0.5)]">
              <img src="/gocaro_logo.webp" alt="GoCaro Logo" class="w-full h-full object-cover" />
            </div>
            <h1 class="text-white text-xl font-black tracking-tight drop-shadow-md hidden sm:block">GOCARO</h1>
          </RouterLink>

          <!-- Nav Links -->
          <nav class="hidden md:flex items-center gap-1 ml-4 bg-white/5 rounded-xl p-1 border border-white/5">
            <RouterLink 
              to="/" 
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              exact-active-class="!bg-primary-500 !text-white shadow-[0_0_15px_rgba(45,212,191,0.5)] !border-primary-400/50"
              :aria-current="$route.path === '/' ? 'page' : undefined"
            >
              Lobby
            </RouterLink>
            <RouterLink 
              to="/leaderboard" 
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              active-class="!bg-primary-500 !text-white shadow-[0_0_15px_rgba(45,212,191,0.5)] !border-primary-400/50"
              :aria-current="$route.path.startsWith('/leaderboard') ? 'page' : undefined"
            >
              Leaderboard
            </RouterLink>
            <RouterLink
              to="/tournaments"
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              active-class="!bg-primary-500 !text-white shadow-[0_0_15px_rgba(45,212,191,0.5)] !border-primary-400/50"
              :aria-current="$route.path.startsWith('/tournaments') ? 'page' : undefined"
            >
              Tournaments
            </RouterLink>
            <RouterLink
              to="/history"
              class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
              active-class="!bg-primary-500 !text-white shadow-[0_0_15px_rgba(45,212,191,0.5)] !border-primary-400/50"
              :aria-current="$route.path.startsWith('/history') ? 'page' : undefined"
            >
              History
            </RouterLink>
          </nav>
        </div>
        
        <!-- Header Actions Slot -->
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-foreground-secondary hover:text-foreground"
            @click="showRankRules = true"
          >
            <Info :size="14" aria-hidden="true" />
            <span>Rank Info</span>
          </button>
          <slot name="actions" />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 relative z-10">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-black/40 border-t border-white/5 py-6 mt-auto relative z-10">
      <div class="mx-auto flex w-full max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
        <div class="flex items-center gap-2 text-xs font-mono text-foreground-muted">
          <span>GoCaro Platform</span>
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
            class="text-foreground-muted hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Github :size="16" aria-hidden="true" />
            GitHub
          </a>
        </div>
      </div>
    </footer>

    <ToastContainer />
    <ChallengeModal />
    <OutgoingChallengeCard />
    <RankRulesModal v-if="showRankRules" @close="showRankRules = false" />
  </div>
</template>
