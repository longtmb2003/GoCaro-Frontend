<script setup lang="ts">
import { computed } from 'vue'

import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'

const auth = useAuthStore()
const game = useGameStore()

const yourColor = computed(() => (game.yourSymbol === 1 ? 'Black' : 'White'))
const opponentColor = computed(() => (game.yourSymbol === 1 ? 'White' : 'Black'))
const turnLabel = computed(() => (game.yourTurn ? 'Your turn' : `${game.opponent}'s turn`))
</script>

<template>
  <AppLayout title="Match">
    <div class="mx-auto max-w-md space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="border-border-subtle bg-surface rounded-lg border p-4 text-center">
          <p class="text-foreground-muted text-xs font-medium tracking-wide uppercase">You</p>
          <p class="text-foreground mt-1 truncate font-semibold">{{ auth.user?.username }}</p>
          <p class="text-foreground-muted mt-1 text-sm">{{ yourColor }}</p>
        </div>
        <div class="border-border-subtle bg-surface rounded-lg border p-4 text-center">
          <p class="text-foreground-muted text-xs font-medium tracking-wide uppercase">Opponent</p>
          <p class="text-foreground mt-1 truncate font-semibold">{{ game.opponent }}</p>
          <p class="text-foreground-muted mt-1 text-sm">{{ opponentColor }}</p>
        </div>
      </div>

      <div
        class="border-border-subtle bg-surface rounded-lg border p-4 text-center"
        aria-live="polite"
      >
        <p class="text-foreground font-medium">{{ turnLabel }}</p>
      </div>
    </div>
  </AppLayout>
</template>
