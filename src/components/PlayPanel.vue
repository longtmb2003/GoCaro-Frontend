<script setup lang="ts">
import { Gamepad2, Lock, Swords, Link2, LogIn } from 'lucide-vue-next'
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
    <div class="mb-4 flex items-center gap-2">
      <h2 class="text-foreground text-lg font-bold flex items-center gap-2">
        <Swords :size="24" class="animate-pulse" aria-hidden="true" /> Ready for Battle?
      </h2>
      <div class="h-px flex-1 bg-gradient-to-r from-border-subtle to-transparent ml-2"></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Ranked: the primary action, marked out by the accent fill. -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="from-primary-600 via-primary-500 to-secondary-500 cursor-pointer bg-gradient-to-br text-left"
        :aria-describedby="isGuest ? 'ranked-locked' : undefined"
        @click="isGuest ? emit('upgrade') : emit('play', 'ranked')"
      >
        <h3 class="text-card text-white">Ranked</h3>
        <p class="text-small mt-1 text-white/90">Play for ELO rating</p>

        <BaseBadge v-if="isGuest" id="ranked-locked" variant="neutral" class="mt-3">
          <Lock :size="16" aria-hidden="true" /> Sign in required
        </BaseBadge>
      </GlassCard>

      <!-- Casual: the secondary action, on the plain card surface. -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="cursor-pointer text-left"
        @click="emit('play', 'casual')"
      >
        <h3 class="text-card text-foreground">Casual</h3>
        <p class="text-small text-foreground-muted mt-1">Just for fun, no pressure</p>

        <BaseBadge variant="primary" class="mt-3"><Gamepad2 :size="16" aria-hidden="true" /> Practice mode</BaseBadge>
      </GlassCard>

      <!-- Create Room: the social feature -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="cursor-pointer text-left"
        @click="isGuest ? emit('upgrade') : emit('create-room')"
      >
        <h3 class="text-card text-foreground">Create Room</h3>
        <p class="text-small text-foreground-muted mt-1">Play with a friend via link</p>

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
