<script setup lang="ts">
import { Gamepad2, Lock, Swords, Link2, LogIn, Trophy, Flame } from 'lucide-vue-next'
import { ref } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import type { MatchmakingMode } from '@/types/game'

withDefaults(defineProps<{ isGuest?: boolean }>(), { isGuest: false })

const emit = defineEmits<{ 
  play: [mode: MatchmakingMode]; 
  upgrade: []; 
  'create-room': []; 
  'join-code': [code: string] 
}>()

const joinCode = ref('')

function submitJoin() {
  const code = joinCode.value.trim().toUpperCase()
  if (code.length === 6) {
    emit('join-code', code)
    joinCode.value = ''
  }
}
</script>

<template>
  <section aria-label="Play">
    <div class="mb-6 flex items-center gap-3">
      <h2 class="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 text-2xl font-black uppercase tracking-widest flex items-center gap-2">
        <Swords :size="28" class="animate-pulse text-red-400" aria-hidden="true" /> PLAY
      </h2>
      <div class="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent ml-2"></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Ranked: the primary action, marked out by the accent fill. -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="bg-gradient-to-br from-red-500/20 via-surface-800/60 to-orange-500/10 border border-red-500/40 cursor-pointer text-left p-5 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:border-red-400/80 transform hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group"
        :aria-describedby="isGuest ? 'ranked-locked' : undefined"
        @click="isGuest ? emit('upgrade') : emit('play', 'ranked')"
      >
        <!-- Background animated orbs -->
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-red-500/30 rounded-full blur-3xl group-hover:bg-red-400/50 transition-colors duration-700 ease-out pointer-events-none"></div>
        <div class="absolute -left-8 -bottom-8 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-400/40 transition-colors duration-700 ease-out pointer-events-none"></div>
        
        <!-- Large background icon -->
        <Trophy class="absolute -right-4 -bottom-4 text-red-500/10 group-hover:text-red-400/30 w-28 h-28 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 ease-out pointer-events-none" />

        <div class="absolute inset-0 bg-red-400/0 group-hover:bg-red-500/10 transition-colors pointer-events-none duration-500"></div>
        
        <!-- Content -->
        <div class="relative z-10">
          <h3 class="text-xl font-bold text-red-100 tracking-wide flex items-center gap-2">
            <Flame :size="20" class="text-orange-400 animate-pulse" />
            Ranked Match
          </h3>
          <p class="text-sm mt-1.5 text-red-200/80">Play competitively for ELO rating</p>

          <BaseBadge v-if="isGuest" id="ranked-locked" variant="neutral" class="mt-4 border-white/10 bg-black/40">
            <Lock :size="16" aria-hidden="true" /> Sign in required
          </BaseBadge>
        </div>
      </GlassCard>

      <!-- Casual: the secondary action, on the plain card surface. -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="cursor-pointer text-left p-5 transform hover:-translate-y-1 hover:shadow-md hover:border-primary-500/30 transition-all duration-300"
        @click="emit('play', 'casual')"
      >
        <h3 class="text-lg font-bold text-foreground">Casual</h3>
        <p class="text-sm text-foreground-muted mt-1.5">Just for fun, no pressure</p>

        <BaseBadge variant="primary" class="mt-3"><Gamepad2 :size="16" aria-hidden="true" /> Practice mode</BaseBadge>
      </GlassCard>

      <!-- Create Room: the social feature -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="cursor-pointer text-left p-5 transform hover:-translate-y-1 hover:shadow-md hover:border-primary-500/30 transition-all duration-300"
        @click="isGuest ? emit('upgrade') : emit('create-room')"
      >
        <h3 class="text-lg font-bold text-foreground">Create Room</h3>
        <p class="text-sm text-foreground-muted mt-1.5">Play with a friend via link</p>

        <BaseBadge v-if="isGuest" variant="neutral" class="mt-3">
          <Lock :size="16" aria-hidden="true" /> Sign in required
        </BaseBadge>
        <BaseBadge v-else variant="primary" class="mt-3">
          <Link2 :size="16" aria-hidden="true" /> Share link
        </BaseBadge>
      </GlassCard>

      <!-- Join with Code -->
      <GlassCard as="div" variant="nested" class="flex flex-col justify-center">
        <h3 class="text-small font-semibold text-foreground mb-2">Join with Code</h3>
        <form class="flex gap-2" @submit.prevent="submitJoin">
          <input
            v-model="joinCode"
            type="text"
            maxlength="6"
            placeholder="6-letter code"
            class="flex-1 bg-background border border-border-subtle rounded px-3 py-2 text-foreground font-mono uppercase focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            :disabled="joinCode.trim().length !== 6"
            class="bg-accent/10 text-accent px-3 py-2 rounded hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn :size="18" aria-hidden="true" />
          </button>
        </form>
      </GlassCard>
    </div>
  </section>
</template>
