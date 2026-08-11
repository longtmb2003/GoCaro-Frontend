<script setup lang="ts">
import { computed } from 'vue'
import { Medal, Crown, Award } from 'lucide-vue-next'
import type { LeaderboardEntry } from '@/types/leaderboard'
import { useUserProfile } from '@/composables/useUserProfile'
import FriendRequestButton from '@/components/FriendRequestButton.vue'
import RankFrame from '@/components/RankFrame.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { getRankSubTier, getRankTier } from '@/config/ranks'

const props = withDefaults(
  defineProps<{
    entries: LeaderboardEntry[] | null
    currentUsername: string
    compact?: boolean
    startIndex?: number
  }>(),
  { compact: false, startIndex: 0 },
)

const { openProfile } = useUserProfile()
const { rankName, t } = useAppLanguage()
const championFrameUrl = `${import.meta.env.BASE_URL}assets/ranks/leaderboard-champion-frame-v3.webp`

const normalizedEntries = computed(() =>
  Array.isArray(props.entries) ? props.entries : [],
)
const eliteEntries = computed(() =>
  !props.compact && props.startIndex === 0 ? normalizedEntries.value.slice(0, 3) : [],
)
const tableEntries = computed(() =>
  eliteEntries.value.length > 0
    ? normalizedEntries.value.slice(eliteEntries.value.length)
    : normalizedEntries.value,
)
const tableStartIndex = computed(() => props.startIndex + eliteEntries.value.length)

const getRankIcon = (rankIndex: number) => {
  if (rankIndex === 0) return Crown
  if (rankIndex === 1) return Medal
  if (rankIndex === 2) return Award
  return null
}

const getTopRowClass = (rankIndex: number) => {
  if (rankIndex === 0) return 'rank-frame rank-first'
  if (rankIndex === 1) return 'rank-frame rank-second'
  if (rankIndex === 2) return 'rank-frame rank-third'
  return ''
}

const formatTitle = (titleCode: string) => {
  if (!titleCode) return ''
  return titleCode.replace('title_', '').split('_').join(' ')
}

const getPlayerRankLabel = (elo: number) => {
  const tier = getRankTier(elo)
  return `${rankName(tier.name)} ${getRankSubTier(elo)}`.trim()
}

const getEliteLabel = (index: number) => {
  if (index === 0) return t('Champion', 'Quán quân')
  if (index === 1) return t('Runner-up', 'Á quân')
  return t('Third place', 'Hạng ba')
}
</script>

<template>
  <ol v-if="compact && normalizedEntries.length > 0" class="compact-leaderboard">
    <li
      v-for="(entry, index) in normalizedEntries"
      :key="entry.username"
      :class="[
        { 'compact-leaderboard__current': entry.username === currentUsername },
        getTopRowClass(startIndex + index)
      ]"
    >
      <img
        v-if="startIndex + index < 3"
        class="compact-leaderboard__art-frame"
        :src="championFrameUrl"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      <span v-if="startIndex + index >= 3" class="compact-leaderboard__rank">
        #{{ startIndex + index + 1 }}
      </span>
      <span v-else class="sr-only">#{{ startIndex + index + 1 }}</span>
      <button type="button" class="flex items-center gap-2" :title="'@' + entry.username" @click="openProfile(entry.id)">
        <span>@{{ entry.username }}</span>
        <small v-if="entry.username === currentUsername">{{ t('You', 'Bạn') }}</small>
      </button>
      <strong>{{ entry.elo }}</strong>
    </li>
  </ol>

  <template v-else-if="normalizedEntries.length > 0">
    <ol v-if="eliteEntries.length > 0" class="leaderboard-showcase" :aria-label="t('Top ranked players', 'Người chơi dẫn đầu')">
      <li
        v-for="(entry, index) in eliteEntries"
        :key="entry.username"
        class="leaderboard-elite"
        :class="[
          `leaderboard-elite--${String(index + 1)}`,
          { 'leaderboard-elite--current': entry.username === currentUsername },
        ]"
      >
        <img
          class="leaderboard-elite__art-frame"
          :src="championFrameUrl"
          alt=""
          aria-hidden="true"
          decoding="async"
        />

        <div class="leaderboard-elite__emblem" aria-hidden="true">
          <RankFrame
            :elo="entry.elo"
            :initial="entry.display_name.charAt(0).toUpperCase()"
            size="md"
          />
          <span>#{{ index + 1 }}</span>
        </div>

        <div class="leaderboard-elite__copy">
          <p>{{ getEliteLabel(index) }}</p>
          <button
            type="button"
            :title="'@' + entry.username"
            @click="openProfile(entry.id)"
          >
            @{{ entry.username }}
          </button>
          <div class="leaderboard-elite__meta">
            <span>{{ getPlayerRankLabel(entry.elo) }}</span>
            <span v-if="entry.title" class="leaderboard-elite__title">
              {{ formatTitle(entry.title) }}
            </span>
            <span v-if="entry.username === currentUsername" class="leaderboard-elite__you">
              {{ t('You', 'Bạn') }}
            </span>
            <FriendRequestButton
              :user-id="entry.id"
              :display-name="entry.display_name"
              compact
            />
          </div>
        </div>

        <div class="leaderboard-elite__rating">
          <strong>{{ entry.elo }}</strong>
          <span>Elo</span>
        </div>
      </li>
    </ol>

    <div v-if="tableEntries.length > 0" class="overflow-x-auto">
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
          v-for="(entry, index) in tableEntries"
          :key="entry.username"
          :class="[
            entry.username === currentUsername
              ? 'bg-accent-soft'
              : 'hover:bg-glass-light transition-colors cursor-default',
            getTopRowClass(tableStartIndex + index)
          ]"
        >
          <td class="text-foreground-muted whitespace-nowrap px-4 py-3 font-medium">
            <!-- The medal replaces the visible rank number for the top three, so
                 the number stays available to assistive tech. -->
            <template v-if="tableStartIndex + index < 3">
              <span class="rank-crest" aria-hidden="true">
                <component
                  :is="getRankIcon(tableStartIndex + index)"
                  :size="24"
                />
              </span>
              <span class="sr-only">#{{ tableStartIndex + index + 1 }}</span>
            </template>
            <span v-else>#{{ tableStartIndex + index + 1 }}</span>
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
  </template>

  <p v-else class="text-foreground-muted text-small py-8 text-center font-medium">
    {{ t('No ranked players yet. Play a match to appear here.', 'Chưa có người chơi xếp hạng. Hãy chơi một trận để xuất hiện tại đây.') }}
  </p>
</template>

<style scoped>
.leaderboard-showcase {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.leaderboard-elite {
  --elite-material: var(--color-rank-bronze);
  --elite-halo: color-mix(in srgb, var(--elite-material) 18%, transparent);
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: calc(var(--space-2xl) * 3);
  align-items: center;
  gap: var(--space-lg);
  overflow: hidden;
  padding: var(--space-lg) var(--space-xl);
  border: 1px solid color-mix(in srgb, var(--elite-material) 48%, var(--color-border));
  border-radius: var(--radius-card);
  background:
    radial-gradient(circle at 50% 0%, var(--elite-halo), transparent 58%),
    linear-gradient(115deg, var(--color-rank-panel), var(--color-rank-panel-deep));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--elite-material) 24%, transparent),
    var(--shadow-card);
}

.leaderboard-elite::before {
  position: absolute;
  inset: var(--space-xs);
  z-index: 1;
  border: 1px solid color-mix(in srgb, var(--elite-material) 22%, transparent);
  border-radius: var(--radius-md);
  content: '';
  pointer-events: none;
}

.leaderboard-elite--1 {
  --elite-material: var(--color-rank-gold-warm);
  min-height: calc(var(--space-2xl) * 3);
  border-color: transparent;
  background:
    radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--color-rank-diamond) 16%, transparent), transparent 45%),
    linear-gradient(115deg, var(--color-rank-panel), var(--color-rank-panel-deep));
  box-shadow: var(--shadow-floating);
}

.leaderboard-elite--2 {
  --elite-material: var(--color-rank-silver);
}

.leaderboard-elite--current {
  box-shadow:
    inset 0 0 0 1px var(--color-accent-soft),
    var(--shadow-floating);
}

.leaderboard-elite__art-frame {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.leaderboard-elite--2 .leaderboard-elite__art-frame {
  filter: saturate(0.24) brightness(1.12);
  opacity: 0.76;
}

.leaderboard-elite--3 .leaderboard-elite__art-frame {
  filter: sepia(0.42) saturate(0.82) brightness(0.94);
  opacity: 0.72;
}

.leaderboard-elite > :not(.leaderboard-elite__art-frame) {
  position: relative;
  z-index: 3;
}

.leaderboard-elite__emblem {
  position: relative;
  display: grid;
  place-items: center;
}

.leaderboard-elite__emblem > span {
  position: absolute;
  right: calc(var(--space-xs) * -1);
  bottom: calc(var(--space-xs) * -1);
  display: grid;
  min-width: var(--space-xl);
  min-height: var(--space-xl);
  place-items: center;
  color: var(--color-rank-panel-deep);
  border-radius: var(--radius-pill);
  background: var(--elite-material);
  box-shadow: 0 0 var(--space-md) var(--elite-halo);
  font-size: var(--text-caption);
  font-weight: 900;
}

.leaderboard-elite__copy {
  min-width: 0;
}

.leaderboard-elite__copy > p {
  color: var(--elite-material);
  font-size: var(--text-caption);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.leaderboard-elite__copy > button {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--color-foreground);
  font-size: var(--text-card);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-duration-fast) ease-out;
}

.leaderboard-elite__copy > button:hover {
  color: var(--color-accent-hover);
}

.leaderboard-elite__meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
  color: var(--color-foreground-muted);
  font-size: var(--text-caption);
}

.leaderboard-elite__title,
.leaderboard-elite__you {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid color-mix(in srgb, var(--elite-material) 34%, transparent);
  border-radius: var(--radius-pill);
  color: var(--elite-material);
  background: color-mix(in srgb, var(--elite-material) 10%, transparent);
  text-transform: capitalize;
  white-space: nowrap;
}

.leaderboard-elite__you {
  color: var(--color-accent);
  border-color: var(--color-accent-soft);
  background: var(--color-accent-soft);
  text-transform: uppercase;
}

.leaderboard-elite__rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: var(--elite-material);
}

.leaderboard-elite__rating strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-section);
  line-height: var(--text-section--line-height);
  text-shadow: 0 0 var(--space-md) var(--elite-halo);
}

.leaderboard-elite__rating span {
  color: var(--color-foreground-muted);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.compact-leaderboard {
  display: flex;
  width: min(100%, 20rem);
  flex-direction: column;
  gap: var(--space-sm);
  margin-inline: auto;
  container-name: compact-ranking;
  container-type: inline-size;
}

.compact-leaderboard li {
  position: relative;
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) minmax(2.75rem, auto);
  min-height: 2.75rem;
  align-items: center;
  gap: var(--space-sm);
  padding-block: var(--space-sm);
  padding-inline: 12cqi;
  border-radius: var(--radius-md);
  transition:
    background var(--transition-duration-fast) ease-out,
    filter var(--transition-duration-fast) ease-out;
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
  overflow: hidden;
  min-width: 0;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 700;
  line-height: 1;
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
  min-width: 2.75rem;
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-small);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: right;
}

/* Competitive rank frames share one material system across the lobby, modal
   and full leaderboard. Each tier only supplies its semantic metal token. */
.rank-first {
  --rank-material: var(--color-rank-gold-warm);
  --rank-name: #e6cf91;
  --rank-name-line: #806630;
  --rank-surface: color-mix(in srgb, var(--color-rank-gold) 13%, var(--surface-glass-light));
  --rank-line: color-mix(in srgb, var(--color-rank-gold-warm) 42%, transparent);
  --rank-halo: color-mix(in srgb, var(--color-rank-gold-warm) 22%, transparent);
}

.rank-second {
  --rank-material: var(--color-rank-silver);
  --rank-name: #c7ccd1;
  --rank-name-line: #69737b;
  --rank-surface: color-mix(in srgb, var(--color-rank-silver) 10%, var(--surface-glass-light));
  --rank-line: color-mix(in srgb, var(--color-rank-silver) 34%, transparent);
  --rank-halo: color-mix(in srgb, var(--color-rank-silver) 16%, transparent);
}

.rank-third {
  --rank-material: var(--color-rank-bronze);
  --rank-name: #c48a55;
  --rank-name-line: #704927;
  --rank-surface: color-mix(in srgb, var(--color-rank-bronze) 11%, var(--surface-glass-light));
  --rank-line: color-mix(in srgb, var(--color-rank-bronze) 36%, transparent);
  --rank-halo: color-mix(in srgb, var(--color-rank-bronze) 16%, transparent);
}

.rank-crest {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--rank-material);
  border: 1px solid var(--rank-line);
  border-radius: var(--radius-pill);
  background:
    radial-gradient(circle at 50% 30%, var(--rank-halo), transparent 58%),
    var(--surface-sunken);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rank-material) 24%, transparent),
    0 0 var(--space-lg) var(--rank-halo);
}

.compact-leaderboard .rank-crest {
  width: 1.75rem;
  height: 1.75rem;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.rank-crest svg {
  color: inherit;
  filter: drop-shadow(0 0 var(--space-sm) var(--rank-halo));
}

.compact-leaderboard .rank-frame {
  width: 100%;
  min-height: 0;
  aspect-ratio: 1771 / 487;
  grid-template-columns: minmax(0, 1fr) minmax(2.75rem, auto);
  isolation: isolate;
  overflow: visible;
  padding-block: 7cqi;
  padding-inline: 8cqi;
  border: 0;
  background: transparent !important;
  box-shadow: none;
}

.compact-leaderboard .rank-first {
  --rank-halo: color-mix(in srgb, var(--color-rank-gold-warm) 32%, transparent);
  z-index: 2;
}

.compact-leaderboard .rank-second {
  --rank-halo: color-mix(in srgb, var(--color-rank-silver) 22%, transparent);
}

.compact-leaderboard .rank-third {
  --rank-halo: color-mix(in srgb, var(--color-rank-bronze) 24%, transparent);
}

.compact-leaderboard .rank-frame::after {
  display: none;
}

.compact-leaderboard .rank-frame::before {
  display: none;
}

.compact-leaderboard__art-frame {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter:
    saturate(0.96)
    brightness(0.98)
    drop-shadow(0 0 var(--space-xs) var(--rank-halo));
  opacity: 1;
  pointer-events: none;
  transition:
    filter 220ms ease-out,
    opacity 220ms ease-out;
}

.compact-leaderboard .rank-first .compact-leaderboard__art-frame {
  animation: champion-frame-glow 4.8s ease-in-out infinite;
  filter:
    saturate(0.94)
    brightness(1.02)
    contrast(1.02)
    drop-shadow(0 0.12rem 0.24rem rgb(2 8 14 / 48%))
    drop-shadow(0 0 0.28rem rgb(184 139 54 / 18%));
}

.compact-leaderboard .rank-second .compact-leaderboard__art-frame {
  filter:
    saturate(0.18)
    brightness(1.02)
    contrast(1.02)
    drop-shadow(0 0.12rem 0.22rem rgb(2 8 14 / 44%))
    drop-shadow(0 0 0.22rem rgb(174 184 191 / 14%));
  opacity: 0.92;
}

.compact-leaderboard .rank-third .compact-leaderboard__art-frame {
  filter:
    sepia(0.54)
    saturate(0.72)
    brightness(0.9)
    contrast(1.02)
    drop-shadow(0 0.12rem 0.22rem rgb(2 8 14 / 44%))
    drop-shadow(0 0 0.22rem rgb(151 91 45 / 16%));
  opacity: 0.9;
}

.compact-leaderboard .rank-frame > :not(.compact-leaderboard__art-frame):not(.sr-only) {
  position: relative;
  z-index: 3;
}

.compact-leaderboard .rank-frame > .sr-only {
  position: absolute;
}

.compact-leaderboard .rank-frame > button {
  justify-self: start;
}

.compact-leaderboard .rank-frame > strong {
  justify-self: end;
}

.compact-leaderboard .rank-frame:hover {
  filter: brightness(1.06);
}

@container compact-ranking (max-width: 20rem) {
  .compact-leaderboard button {
    gap: var(--space-xs);
  }

  .compact-leaderboard small {
    padding-inline: 0.25rem;
    letter-spacing: 0.04em;
  }
}

.leaderboard-full-table {
  border-collapse: separate;
  border-spacing: 0 var(--space-xs);
}

.leaderboard-full-table tbody {
  background: transparent;
}

.leaderboard-full-table .rank-frame td {
  border-top: 1px solid var(--rank-line);
  border-bottom: 1px solid var(--rank-line);
  background:
    linear-gradient(180deg, var(--rank-line), transparent 1px) top / 100% 1px no-repeat,
    radial-gradient(circle at 50% 0%, var(--rank-halo), transparent 60%),
    linear-gradient(90deg, var(--rank-surface), var(--surface-glass-light));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--rank-material) 12%, transparent);
}

.leaderboard-full-table .rank-frame td:first-child {
  border-left: 1px solid var(--rank-line);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  box-shadow:
    inset var(--space-xs) 0 0 color-mix(in srgb, var(--rank-material) 68%, transparent),
    0 0 var(--space-xl) var(--rank-halo);
}

.leaderboard-full-table .rank-frame td:last-child {
  border-right: 1px solid var(--rank-line);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  box-shadow: inset calc(var(--space-xs) * -1) 0 0 color-mix(in srgb, var(--rank-material) 68%, transparent);
}

.rank-frame button span:first-child,
.leaderboard-full-table .rank-frame button,
.leaderboard-full-table .rank-frame span.font-mono,
.compact-leaderboard .rank-frame strong {
  color: var(--rank-material) !important;
  text-shadow: 0 0 var(--space-sm) var(--rank-halo);
}

.compact-leaderboard .rank-frame button span:first-child,
.compact-leaderboard .rank-frame strong {
  font-weight: 800;
  letter-spacing: 0.01em;
}

.compact-leaderboard .rank-frame button span:first-child {
  position: relative;
  padding: 0.08rem 0.12rem 0.16rem;
  color: var(--rank-name) !important;
  border-bottom: 1px solid color-mix(in srgb, var(--rank-name-line) 72%, transparent);
  background: transparent;
  box-shadow:
    0 0.12rem 0 -0.08rem var(--rank-name-line),
    0 0.28rem 0.55rem -0.48rem var(--rank-name);
  font-family: 'Manrope', Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.84rem, 4.85cqi, 1.02rem);
  font-weight: 850;
  letter-spacing: 0.008em;
  line-height: 1;
  text-shadow:
    0 1px 0 rgb(2 7 12 / 92%),
    0 0 0.42rem color-mix(in srgb, var(--rank-name) 16%, transparent);
  transition:
    color 180ms ease-out,
    box-shadow 180ms ease-out,
    text-shadow 180ms ease-out;
}

.compact-leaderboard .rank-frame > strong {
  font-size: clamp(0.72rem, 3.7cqi, 0.82rem);
  font-weight: 750;
  letter-spacing: 0.02em;
  opacity: 0.74;
}

.compact-leaderboard .rank-first button span:first-child {
  animation: champion-name-glow 4.8s ease-in-out infinite;
  font-size: clamp(0.9rem, 5.1cqi, 1.08rem);
  border-bottom-color: color-mix(in srgb, var(--rank-name-line) 84%, transparent);
  text-shadow:
    0 1px 0 rgb(2 7 12 / 96%),
    0 0 0.48rem color-mix(in srgb, var(--rank-name) 20%, transparent);
}

.compact-leaderboard .rank-frame:hover button span:first-child {
  color: color-mix(in srgb, var(--rank-name) 90%, white) !important;
  box-shadow:
    0 0.12rem 0 -0.08rem var(--rank-name),
    0 0.34rem 0.7rem -0.44rem var(--rank-name);
  text-shadow:
    0 1px 0 rgb(2 7 12 / 94%),
    0 0 0.54rem color-mix(in srgb, var(--rank-name) 30%, transparent);
}

@keyframes champion-frame-glow {
  0%,
  100% {
    filter:
      saturate(0.94)
      brightness(1.02)
      contrast(1.02)
      drop-shadow(0 0.12rem 0.24rem rgb(2 8 14 / 48%))
      drop-shadow(0 0 0.24rem rgb(184 139 54 / 16%));
  }

  50% {
    filter:
      saturate(0.98)
      brightness(1.06)
      contrast(1.02)
      drop-shadow(0 0.12rem 0.24rem rgb(2 8 14 / 48%))
      drop-shadow(0 0 0.46rem rgb(184 139 54 / 28%));
  }
}

@keyframes champion-name-glow {
  0%,
  100% {
    text-shadow:
      0 1px 0 rgb(2 7 12 / 96%),
      0 0 0.42rem color-mix(in srgb, var(--rank-name) 18%, transparent);
  }

  50% {
    text-shadow:
      0 1px 0 rgb(2 7 12 / 96%),
      0 0 0.62rem color-mix(in srgb, var(--rank-name) 34%, transparent);
  }
}

.compact-leaderboard .rank-first small {
  border: 1px solid color-mix(in srgb, var(--color-accent) 46%, transparent);
  box-shadow: 0 0 var(--space-md) color-mix(in srgb, var(--color-accent) 28%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .compact-leaderboard li {
    transition: none;
  }

  .compact-leaderboard__art-frame,
  .compact-leaderboard .rank-frame button span:first-child {
    animation: none;
    transition: none;
  }
}

@media (max-width: 39.99rem) {
  .leaderboard-elite--1 {
    min-height: calc(var(--space-2xl) * 3);
    padding-inline: var(--space-xl);
  }

  .leaderboard-elite__art-frame {
    opacity: 0.62;
  }

  .leaderboard-elite__title {
    display: none;
  }
}
</style>
