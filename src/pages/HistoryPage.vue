<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
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

    <GlassCard
      title="Recent matches"
      class="mx-auto max-w-2xl"
    >
      <template #icon><span aria-hidden="true">📜</span></template>
      <template #actions>
        <p class="text-foreground-muted text-caption tracking-wider uppercase">All players</p>
      </template>

      <p v-if="history.loading" class="text-foreground-muted py-xl text-body text-center">
        Loading match history…
      </p>

      <ErrorState v-else-if="history.error" :message="history.error">
        <template #action>
          <BaseButton variant="secondary" @click="history.load(history.page)">
            Try again
          </BaseButton>
        </template>
      </ErrorState>

      <template v-else>
        <MatchHistoryList :matches="history.matches" :current-user-id="auth.user?.id ?? ''" />

        <div
          v-if="history.total > 0"
          class="border-border-subtle mt-xl pt-lg flex items-center justify-between border-t"
        >
          <BaseButton variant="secondary" :disabled="!history.hasPrev" @click="history.prevPage()">
            Previous
          </BaseButton>
          <span class="text-foreground-muted text-small font-semibold tabular-nums">
            Page {{ history.page }} of {{ history.totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="!history.hasNext" @click="history.nextPage()">
            Next
          </BaseButton>
        </div>
      </template>
    </GlassCard>
  </AppLayout>
</template>
