<script setup lang="ts">
import { Medal } from 'lucide-vue-next'
import type { LeaderboardEntry } from '@/types/leaderboard'
import { getRankTier } from '@/config/ranks'

withDefaults(
  defineProps<{
    entries: LeaderboardEntry[]
    currentUsername: string
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <div v-if="entries.length > 0" class="overflow-x-auto">
    <table class="w-full text-left" :class="compact ? 'text-caption' : 'text-small'">
      <thead class="border-border-subtle bg-glass-light text-caption border-b">
        <tr>
          <th
            scope="col"
            class="text-foreground-muted font-semibold uppercase tracking-wide"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            Rank
          </th>
          <th
            scope="col"
            class="text-foreground-muted font-semibold uppercase tracking-wide"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            Player
          </th>
          <th
            scope="col"
            class="text-foreground-muted text-right font-semibold uppercase tracking-wide"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            Rating
          </th>
        </tr>
      </thead>
      <tbody class="divide-border-subtle divide-y">
        <tr
          v-for="(entry, index) in entries"
          :key="entry.username"
          :class="
            entry.username === currentUsername
              ? 'bg-accent-soft'
              : 'hover:bg-glass-light transition-colors cursor-default'
          "
        >
          <td
            class="text-foreground-muted whitespace-nowrap font-medium"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            <!-- The medal replaces the visible rank number for the top three, so
                 the number stays available to assistive tech. -->
            <template v-if="index < 3">
              <Medal :size="18" aria-hidden="true" />
              <span class="sr-only">#{{ index + 1 }}</span>
            </template>
            <span v-else>#{{ index + 1 }}</span>
          </td>
          <td
            class="text-foreground whitespace-nowrap font-bold"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            {{ entry.username }}
            <span
              v-if="entry.username === currentUsername"
              class="text-accent text-caption ml-2 font-black tracking-widest uppercase"
            >
              (You)
            </span>
          </td>
          <td
            class="text-foreground whitespace-nowrap text-right"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            <div class="flex items-center justify-end gap-2">
              <span class="font-mono font-bold">{{ entry.elo }}</span>
              <span
                class="text-caption font-black tracking-widest uppercase"
                :class="getRankTier(entry.elo).color"
              >
                {{ getRankTier(entry.elo).name }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p v-else class="text-foreground-muted text-small py-8 text-center font-medium">
    No ranked players yet. Play a match to appear here.
  </p>
</template>
