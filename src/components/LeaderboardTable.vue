<script setup lang="ts">
import { Medal } from 'lucide-vue-next'
import type { LeaderboardEntry } from '@/types/leaderboard'
import { useUserProfile } from '@/composables/useUserProfile'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'

withDefaults(
  defineProps<{
    entries: LeaderboardEntry[]
    currentUsername: string
    compact?: boolean
    startIndex?: number
  }>(),
  { compact: false, startIndex: 0 },
)

const { openProfile } = useUserProfile()
</script>

<template>
  <ol v-if="compact && entries.length > 0" class="compact-leaderboard">
    <li
      v-for="(entry, index) in entries"
      :key="entry.username"
      :class="{ 'compact-leaderboard__current': entry.username === currentUsername }"
    >
      <span class="compact-leaderboard__rank">
        <FantasySystemIcon v-if="startIndex + index < 3" compact>
          <Medal :size="18" aria-hidden="true" />
        </FantasySystemIcon>
        <span v-else>#{{ startIndex + index + 1 }}</span>
        <span v-if="startIndex + index < 3" class="sr-only">#{{ startIndex + index + 1 }}</span>
      </span>
      <button type="button" @click="openProfile(entry.id)">
        <span>@{{ entry.username }}</span>
        <small v-if="entry.username === currentUsername">You</small>
      </button>
      <strong>{{ entry.elo }}</strong>
    </li>
  </ol>

  <div v-else-if="entries.length > 0" class="overflow-x-auto">
    <table class="w-full text-left text-small">
      <thead class="border-border-subtle bg-glass-light text-caption border-b">
        <tr>
          <th
            scope="col"
            class="text-foreground-muted px-4 py-3 font-semibold uppercase tracking-wide"
          >
            Rank
          </th>
          <th
            scope="col"
            class="text-foreground-muted px-4 py-3 font-semibold uppercase tracking-wide"
          >
            Player
          </th>
          <th
            scope="col"
            class="text-foreground-muted px-4 py-3 text-right font-semibold uppercase tracking-wide"
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
          <td class="text-foreground-muted whitespace-nowrap px-4 py-3 font-medium">
            <!-- The medal replaces the visible rank number for the top three, so
                 the number stays available to assistive tech. -->
            <template v-if="startIndex + index < 3">
              <FantasySystemIcon compact><Medal :size="18" aria-hidden="true" /></FantasySystemIcon>
              <span class="sr-only">#{{ startIndex + index + 1 }}</span>
            </template>
            <span v-else>#{{ startIndex + index + 1 }}</span>
          </td>
          <td class="text-foreground px-4 py-3 font-bold break-all">
            <button
              class="hover:text-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded text-left"
              @click="openProfile(entry.id)"
            >
              @{{ entry.username }}
            </button>
            <span
              v-if="entry.username === currentUsername"
              class="text-accent text-caption ml-2 font-black tracking-widest uppercase"
            >
              (You)
            </span>
          </td>
          <td class="text-foreground whitespace-nowrap px-4 py-3 text-right">
            <div class="flex items-center justify-end gap-2">
              <span class="font-mono font-bold">{{ entry.elo }}</span>
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

<style scoped>
.compact-leaderboard {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.compact-leaderboard li {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-duration-fast) ease-out;
}

.compact-leaderboard li:hover {
  background: var(--surface-glass-light);
}

.compact-leaderboard__current {
  background: linear-gradient(90deg, var(--color-accent-soft), transparent);
}

.compact-leaderboard__rank {
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 800;
}

.compact-leaderboard li:nth-child(-n + 3) .compact-leaderboard__rank {
  color: var(--color-warning);
}

.compact-leaderboard button {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
  text-align: left;
}

.compact-leaderboard button > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-leaderboard button:hover {
  color: var(--color-accent);
}

.compact-leaderboard small {
  padding: 0.125rem 0.375rem;
  color: var(--color-accent);
  font-size: 0.625rem;
  letter-spacing: 0.08em;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  text-transform: uppercase;
}

.compact-leaderboard strong {
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-small);
}
</style>
