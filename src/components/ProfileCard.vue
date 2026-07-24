<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import type { AccountType } from '@/types/auth'

const props = defineProps<{
  username: string
  elo: number
  accountType: AccountType
}>()

const emit = defineEmits<{ upgrade: [] }>()

const initial = computed(() => props.username.charAt(0).toUpperCase())
const isGuest = computed(() => props.accountType === 'anonymous')
</script>

<template>
  <section
    class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm"
    aria-label="Your profile"
  >
    <div class="flex items-center gap-4">
      <div
        class="bg-primary-600 flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
        aria-hidden="true"
      >
        {{ initial }}
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-foreground truncate text-lg font-semibold">{{ username }}</p>
          <span
            v-if="isGuest"
            class="bg-warning-500/15 text-warning-600 dark:text-warning-400 shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-medium"
          >
            Guest
          </span>
        </div>
        <p class="text-foreground-muted text-sm">
          {{ isGuest ? 'Playing as guest' : 'Signed in' }}
        </p>
      </div>
    </div>

    <dl class="border-border-subtle mt-6 border-t pt-4">
      <div class="flex items-baseline justify-between">
        <dt class="text-foreground-muted text-sm font-medium">Rating</dt>
        <dd class="text-foreground text-2xl font-semibold tabular-nums">{{ elo }}</dd>
      </div>
    </dl>

    <div v-if="isGuest" class="border-border-subtle mt-4 border-t pt-4">
      <p class="text-foreground-muted text-sm">
        This account lives only on this device. Save it to keep your rating and match history.
      </p>
      <BaseButton class="mt-3 w-full" @click="emit('upgrade')">Save progress</BaseButton>
    </div>
  </section>
</template>
