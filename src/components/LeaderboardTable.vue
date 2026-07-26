<script setup lang="ts">
import type { LeaderboardEntry } from '@/types/leaderboard'
import { getRankTier } from '@/config/ranks'

withDefaults(
  defineProps<{
    entries: LeaderboardEntry[]
    currentUsername: string
    compact?: boolean
  }>(),
  { compact: false }
)
</script>

<template>
  <div v-if="entries.length > 0" class="overflow-x-auto">
    <table class="w-full text-left" :class="compact ? 'text-xs' : 'text-sm'">
      <thead
        class="border-border-subtle bg-surface-elevated border-b"
        :class="compact ? 'text-[10px]' : 'text-xs'"
      >
        <tr>
          <th scope="col" class="text-foreground-muted font-medium uppercase tracking-wide" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            Rank
          </th>
          <th scope="col" class="text-foreground-muted font-medium uppercase tracking-wide" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            Player
          </th>
          <th
            scope="col"
            class="text-foreground-muted text-right font-medium uppercase tracking-wide"
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
          :class="entry.username === currentUsername ? 'bg-primary-500/10' : 'hover:bg-surface-elevated transition-colors'"
        >
          <td class="text-foreground-muted whitespace-nowrap" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            <span v-if="index === 0" class="text-xl">🥇</span>
            <span v-else-if="index === 1" class="text-xl">🥈</span>
            <span v-else-if="index === 2" class="text-xl">🥉</span>
            <span v-else>#{{ index + 1 }}</span>
          </td>
          <td class="text-foreground whitespace-nowrap font-medium" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            {{ entry.username }}
            <span
              v-if="entry.username === currentUsername"
              class="text-primary-500 ml-2 text-xs font-normal"
            >
              (You)
            </span>
          </td>
          <td class="text-foreground whitespace-nowrap text-right" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            <div class="flex items-center justify-end gap-2">
              <span class="font-mono">{{ entry.elo }}</span>
              <span class="text-[10px] font-bold tracking-wide uppercase opacity-90" :class="getRankTier(entry.elo).color">
                {{ getRankTier(entry.elo).name }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p v-else class="text-foreground-muted py-8 text-center text-sm">
    No ranked players yet. Play a match to appear here.
  </p>
</template>
