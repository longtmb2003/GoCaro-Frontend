<script setup lang="ts">
import { Medal, Crown, Award } from 'lucide-vue-next'
import type { LeaderboardEntry } from '@/types/leaderboard'
import { useUserProfile } from '@/composables/useUserProfile'
import FriendRequestButton from '@/components/FriendRequestButton.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

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
const { t } = useAppLanguage()

const getRankIcon = (rankIndex: number) => {
  if (rankIndex === 0) return Crown
  if (rankIndex === 1) return Medal
  if (rankIndex === 2) return Award
  return null
}

const getRankIconClass = (rankIndex: number) => {
  if (rankIndex === 0) return 'icon-gold'
  if (rankIndex === 1) return 'icon-silver'
  if (rankIndex === 2) return 'icon-bronze'
  return ''
}

const getTopRowClass = (rankIndex: number) => {
  if (rankIndex === 0) return 'rank-first'
  if (rankIndex === 1) return 'rank-second'
  if (rankIndex === 2) return 'rank-third'
  return ''
}

const formatTitle = (titleCode: string) => {
  if (!titleCode) return ''
  return titleCode.replace('title_', '').split('_').join(' ')
}
</script>

<template>
  <ol v-if="compact && entries.length > 0" class="compact-leaderboard">
    <li
      v-for="(entry, index) in entries"
      :key="entry.username"
      :class="[
        { 'compact-leaderboard__current': entry.username === currentUsername },
        getTopRowClass(startIndex + index)
      ]"
    >
      <span class="compact-leaderboard__rank">
        <template v-if="startIndex + index < 3">
          <component :is="getRankIcon(startIndex + index)" :size="20" aria-hidden="true" :class="getRankIconClass(startIndex + index)" />
        </template>
        <span v-else>#{{ startIndex + index + 1 }}</span>
        <span v-if="startIndex + index < 3" class="sr-only">#{{ startIndex + index + 1 }}</span>
      </span>
      <button type="button" class="flex items-center gap-2" :title="'@' + entry.username" @click="openProfile(entry.id)">
        <span>@{{ entry.username }}</span>
        <span v-if="entry.title" class="text-[0.6rem] leading-tight font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize whitespace-nowrap">{{ formatTitle(entry.title) }}</span>
        <small v-if="entry.username === currentUsername">{{ t('You', 'Bạn') }}</small>
      </button>
      <strong>{{ entry.elo }}</strong>
      <FriendRequestButton
        :user-id="entry.id"
        :display-name="entry.display_name"
        compact
      />
    </li>
  </ol>

  <div v-else-if="entries.length > 0" class="overflow-x-auto">
    <table class="w-full text-left text-small leaderboard-full-table">
      <thead class="border-border-subtle bg-glass-light text-caption border-b">
        <tr>
          <th
            scope="col"
            class="text-foreground-muted px-4 py-3 font-semibold uppercase tracking-wide"
          >
            {{ t('Rank', 'Hạng') }}
          </th>
          <th
            scope="col"
            class="text-foreground-muted px-4 py-3 font-semibold uppercase tracking-wide"
          >
            {{ t('Player', 'Người chơi') }}
          </th>
          <th
            scope="col"
            class="text-foreground-muted px-4 py-3 text-right font-semibold uppercase tracking-wide"
          >
            {{ t('Rating', 'Điểm') }}
          </th>
          <th scope="col" class="text-foreground-muted px-4 py-3 text-right font-semibold uppercase tracking-wide">
            {{ t('Social', 'Kết nối') }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-border-subtle divide-y">
        <tr
          v-for="(entry, index) in entries"
          :key="entry.username"
          :class="[
            entry.username === currentUsername
              ? 'bg-accent-soft'
              : 'hover:bg-glass-light transition-colors cursor-default',
            getTopRowClass(startIndex + index)
          ]"
        >
          <td class="text-foreground-muted whitespace-nowrap px-4 py-3 font-medium">
            <!-- The medal replaces the visible rank number for the top three, so
                 the number stays available to assistive tech. -->
            <template v-if="startIndex + index < 3">
              <component :is="getRankIcon(startIndex + index)" :size="24" aria-hidden="true" :class="getRankIconClass(startIndex + index)" />
              <span class="sr-only">#{{ startIndex + index + 1 }}</span>
            </template>
            <span v-else>#{{ startIndex + index + 1 }}</span>
          </td>
          <td class="text-foreground px-4 py-3 font-bold break-all">
            <button
              class="hover:text-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded text-left flex items-center gap-2"
              :title="'@' + entry.username"
              @click="openProfile(entry.id)"
            >
              <span>@{{ entry.username }}</span>
              <span v-if="entry.title" class="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize whitespace-nowrap">{{ formatTitle(entry.title) }}</span>
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
              <span class="font-mono font-bold text-base">{{ entry.elo }}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-right">
            <FriendRequestButton
              :user-id="entry.id"
              :display-name="entry.display_name"
              compact
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p v-else class="text-foreground-muted text-small py-8 text-center font-medium">
    {{ t('No ranked players yet. Play a match to appear here.', 'Chưa có người chơi xếp hạng. Hãy chơi một trận để xuất hiện tại đây.') }}
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
  grid-template-columns: 2rem minmax(0, 1fr) auto auto;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-duration-fast) ease-out;
  position: relative;
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

.compact-leaderboard button {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0;
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


/* --- FANTASY GLASSMORPHIC FRAMES FOR TOP 3 --- */

/* Icons */
.icon-gold {
  color: #FCE68C;
  filter: drop-shadow(0 0 8px rgba(252, 230, 140, 0.6));
}
.icon-silver {
  color: #E2E8F0;
  filter: drop-shadow(0 0 6px rgba(226, 232, 240, 0.5));
}
.icon-bronze {
  color: #E6B981;
  filter: drop-shadow(0 0 6px rgba(230, 185, 129, 0.5));
}

/* Rank 1: Grandmaster */
.compact-leaderboard .rank-first {
  background: linear-gradient(135deg, rgba(252, 230, 140, 0.15), transparent) !important;
  border: 1px solid rgba(252, 230, 140, 0.2);
  border-left: 2px solid #FCE68C;
  box-shadow: inset 0 0 20px rgba(252, 230, 140, 0.05), -2px 0 10px rgba(252, 230, 140, 0.15);
}
.compact-leaderboard .rank-first:hover {
  border-color: rgba(252, 230, 140, 0.4);
  background: linear-gradient(135deg, rgba(252, 230, 140, 0.2), transparent) !important;
}

.leaderboard-full-table .rank-first td {
  background: linear-gradient(90deg, rgba(252, 230, 140, 0.1), transparent);
  border-top: 1px solid rgba(252, 230, 140, 0.2);
  border-bottom: 1px solid rgba(252, 230, 140, 0.2);
}
.leaderboard-full-table .rank-first td:first-child {
  border-left: 2px solid #FCE68C;
  box-shadow: -2px 0 10px rgba(252, 230, 140, 0.15);
}

.rank-first button span:first-child,
.leaderboard-full-table .rank-first button {
  font-family: 'Cinzel', serif !important;
  color: #FCE68C !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px rgba(252, 230, 140, 0.4);
}
.leaderboard-full-table .rank-first span.font-mono,
.compact-leaderboard .rank-first strong {
  font-family: 'Cinzel', serif !important;
  color: #FCE68C !important;
  text-shadow: 0 0 8px rgba(252, 230, 140, 0.4);
}

/* Rank 2: Master */
.compact-leaderboard .rank-second {
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.15), transparent) !important;
  border: 1px solid rgba(226, 232, 240, 0.2);
  border-left: 2px solid #E2E8F0;
  box-shadow: inset 0 0 20px rgba(226, 232, 240, 0.05), -2px 0 10px rgba(226, 232, 240, 0.1);
}
.compact-leaderboard .rank-second:hover {
  border-color: rgba(226, 232, 240, 0.4);
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.2), transparent) !important;
}

.leaderboard-full-table .rank-second td {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.1), transparent);
  border-top: 1px solid rgba(226, 232, 240, 0.2);
  border-bottom: 1px solid rgba(226, 232, 240, 0.2);
}
.leaderboard-full-table .rank-second td:first-child {
  border-left: 2px solid #E2E8F0;
  box-shadow: -2px 0 10px rgba(226, 232, 240, 0.1);
}

.rank-second button span:first-child,
.leaderboard-full-table .rank-second button {
  font-family: 'Cinzel', serif !important;
  color: #E2E8F0 !important;
  font-weight: 700 !important;
  letter-spacing: 0.03em;
  text-shadow: 0 0 8px rgba(226, 232, 240, 0.3);
}
.leaderboard-full-table .rank-second span.font-mono,
.compact-leaderboard .rank-second strong {
  font-family: 'Cinzel', serif !important;
  color: #E2E8F0 !important;
  text-shadow: 0 0 8px rgba(226, 232, 240, 0.3);
}

/* Rank 3: Diamond */
.compact-leaderboard .rank-third {
  background: linear-gradient(135deg, rgba(230, 185, 129, 0.15), transparent) !important;
  border: 1px solid rgba(230, 185, 129, 0.2);
  border-left: 2px solid #E6B981;
  box-shadow: inset 0 0 20px rgba(230, 185, 129, 0.05), -2px 0 10px rgba(230, 185, 129, 0.1);
}
.compact-leaderboard .rank-third:hover {
  border-color: rgba(230, 185, 129, 0.4);
  background: linear-gradient(135deg, rgba(230, 185, 129, 0.2), transparent) !important;
}

.leaderboard-full-table .rank-third td {
  background: linear-gradient(90deg, rgba(230, 185, 129, 0.1), transparent);
  border-top: 1px solid rgba(230, 185, 129, 0.2);
  border-bottom: 1px solid rgba(230, 185, 129, 0.2);
}
.leaderboard-full-table .rank-third td:first-child {
  border-left: 2px solid #E6B981;
  box-shadow: -2px 0 10px rgba(230, 185, 129, 0.1);
}

.rank-third button span:first-child,
.leaderboard-full-table .rank-third button {
  font-family: 'Cinzel', serif !important;
  color: #E6B981 !important;
  font-weight: 700 !important;
  letter-spacing: 0.03em;
  text-shadow: 0 0 8px rgba(230, 185, 129, 0.3);
}
.leaderboard-full-table .rank-third span.font-mono,
.compact-leaderboard .rank-third strong {
  font-family: 'Cinzel', serif !important;
  color: #E6B981 !important;
  text-shadow: 0 0 8px rgba(230, 185, 129, 0.3);
}
</style>
