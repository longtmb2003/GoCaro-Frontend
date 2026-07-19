<script setup lang="ts">
import type { LeaderboardEntry } from '@/types/leaderboard'

defineProps<{
  entries: LeaderboardEntry[]
  currentUsername: string
}>()
</script>

<template>
  <table v-if="entries.length > 0" class="w-full text-sm">
    <thead>
      <tr class="text-foreground-muted text-left">
        <th scope="col" class="w-12 py-2 pr-2 font-medium">#</th>
        <th scope="col" class="py-2 pr-2 font-medium">Player</th>
        <th scope="col" class="py-2 pl-2 text-right font-medium">Elo</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(entry, index) in entries"
        :key="entry.username"
        class="border-border-subtle border-t"
        :class="
          entry.username === currentUsername
            ? 'bg-primary-600/10 text-foreground'
            : 'text-foreground'
        "
      >
        <td class="text-foreground-muted py-2.5 pr-2 tabular-nums">{{ index + 1 }}</td>
        <td class="py-2.5 pr-2">
          <span class="font-medium">{{ entry.username }}</span>
          <span
            v-if="entry.username === currentUsername"
            class="bg-primary-600 ml-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          >
            You
          </span>
        </td>
        <td class="py-2.5 pl-2 text-right font-semibold tabular-nums">{{ entry.elo }}</td>
      </tr>
    </tbody>
  </table>

  <p v-else class="text-foreground-muted py-8 text-center text-sm">
    No ranked players yet. Play a match to appear here.
  </p>
</template>
