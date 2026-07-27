<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import MatchHistoryList from '@/components/MatchHistoryList.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'

const auth = useAuthStore()
const history = useHistoryStore()

onMounted(() => {
  void history.load(1)
})
</script>

<template>
  <AppLayout title="Match history">
    <template #actions>
      <RouterLink
        to="/"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        Back to lobby
      </RouterLink>
    </template>

    <section
      class="bg-black/40 backdrop-blur-2xl mx-auto max-w-2xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
      aria-label="Match history"
    >
      <div class="absolute -right-4 -bottom-4 text-9xl opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-500">📜</div>

      <div class="mb-4 flex items-baseline justify-between relative z-10">
        <h2 class="text-white text-xl font-extrabold flex items-center gap-2">
          <span class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">📜</span> Recent matches
        </h2>
        <p class="text-white/60 text-xs font-semibold tracking-wider uppercase">All players</p>
      </div>

      <div v-if="history.loading" class="text-white/50 py-8 text-center text-sm font-medium relative z-10">
        Loading match history…
      </div>

      <div v-else-if="history.error" class="py-8 text-center relative z-10">
        <p class="text-danger-400 text-sm font-medium">{{ history.error }}</p>
        <BaseButton variant="secondary" class="mt-4 border-white/10 bg-white/5 hover:bg-white/10 text-white" @click="history.load(history.page)">
          Try again
        </BaseButton>
      </div>

      <template v-else>
        <div class="relative z-10">
          <MatchHistoryList :matches="history.matches" :current-user-id="auth.user?.id ?? ''" />
        </div>

        <div
          v-if="history.total > 0"
          class="border-white/10 mt-6 flex items-center justify-between border-t pt-4 relative z-10"
        >
          <BaseButton variant="secondary" :disabled="!history.hasPrev" class="border-white/20 bg-white/5 hover:bg-white/10 text-white" @click="history.prevPage()">
            Previous
          </BaseButton>
          <span class="text-white/60 font-semibold tracking-wide text-sm tabular-nums">
            Page {{ history.page }} of {{ history.totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="!history.hasNext" class="border-white/20 bg-white/5 hover:bg-white/10 text-white" @click="history.nextPage()">
            Next
          </BaseButton>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
