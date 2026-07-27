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
        class="border-white/10 bg-white/5 border-b backdrop-blur-md"
        :class="compact ? 'text-[10px]' : 'text-xs'"
      >
        <tr>
          <th scope="col" class="text-white/60 font-semibold uppercase tracking-wide" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            Rank
          </th>
          <th scope="col" class="text-white/60 font-semibold uppercase tracking-wide" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            Player
          </th>
          <th
            scope="col"
            class="text-white/60 text-right font-semibold uppercase tracking-wide"
            :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
          >
            Rating
          </th>
        </tr>
      </thead>
      <tbody class="divide-white/10 divide-y">
        <tr
          v-for="(entry, index) in entries"
          :key="entry.username"
          :class="entry.username === currentUsername ? 'bg-amber-500/20' : 'hover:bg-white/5 transition-colors cursor-default'"
        >
          <td class="text-white/60 whitespace-nowrap font-medium" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            <span v-if="index === 0" class="text-xl drop-shadow-md">🥇</span>
            <span v-else-if="index === 1" class="text-xl drop-shadow-md">🥈</span>
            <span v-else-if="index === 2" class="text-xl drop-shadow-md">🥉</span>
            <span v-else>#{{ index + 1 }}</span>
          </td>
          <td class="text-white whitespace-nowrap font-bold drop-shadow-sm" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            {{ entry.username }}
            <span
              v-if="entry.username === currentUsername"
              class="text-amber-400 ml-2 text-[10px] font-black tracking-widest uppercase"
            >
              (You)
            </span>
          </td>
          <td class="text-white whitespace-nowrap text-right" :class="compact ? 'px-3 py-2' : 'px-4 py-3'">
            <div class="flex items-center justify-end gap-2">
              <span class="font-mono font-bold">{{ entry.elo }}</span>
              <span class="text-[10px] font-black tracking-widest uppercase opacity-100" :class="getRankTier(entry.elo).color">
                {{ getRankTier(entry.elo).name }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p v-else class="text-white/50 py-8 text-center text-sm font-medium">
    No ranked players yet. Play a match to appear here.
  </p>
</template>
