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
      class="border-border-subtle bg-surface mx-auto max-w-2xl rounded-lg border p-6 shadow-sm"
      aria-label="Match history"
    >
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="text-foreground text-lg font-semibold">Recent matches</h2>
        <p class="text-foreground-muted text-xs">All players</p>
      </div>

      <div v-if="history.loading" class="text-foreground-muted py-8 text-center text-sm">
        Loading match history…
      </div>

      <div v-else-if="history.error" class="py-8 text-center">
        <p class="text-danger-400 text-sm">{{ history.error }}</p>
        <BaseButton variant="secondary" class="mt-4" @click="history.load(history.page)">
          Try again
        </BaseButton>
      </div>

      <template v-else>
        <MatchHistoryList :matches="history.matches" :current-user-id="auth.user?.id ?? ''" />

        <div
          v-if="history.total > 0"
          class="border-border-subtle mt-4 flex items-center justify-between border-t pt-4"
        >
          <BaseButton variant="secondary" :disabled="!history.hasPrev" @click="history.prevPage()">
            Previous
          </BaseButton>
          <span class="text-foreground-muted text-sm tabular-nums">
            Page {{ history.page }} of {{ history.totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="!history.hasNext" @click="history.nextPage()">
            Next
          </BaseButton>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
