<template>
  <BaseModal
    v-if="isProfileModalOpen"
    title="Player Profile"
    size="md"
    variant="fantasy"
    @close="closeProfile"
  >
    <div v-if="isLoadingProfile" class="flex justify-center items-center py-12">
      <BaseSpinner class="text-primary-400" />
    </div>

    <div v-else-if="profileError" class="text-center py-8">
      <p class="text-danger-400 mb-4">{{ profileError }}</p>
      <BaseButton variant="secondary" @click="closeProfile">Close</BaseButton>
    </div>

    <div v-else-if="profileData" class="space-y-6">
      <!-- Header: Avatar & Basic Info -->
      <div class="profile-identity" :data-rank-tier="profileTier.name.toLowerCase()">
        <RankFrame
          :elo="profileData.elo"
          :initial="profileData.display_name.charAt(0).toUpperCase()"
          size="xl"
        />
        <div class="profile-identity__copy">
          <p class="profile-identity__eyebrow">{{ profileRankLabel }}</p>
          <h2 class="profile-identity__name">
            {{ profileData.display_name }}
          </h2>
          <!-- Show the handle for all registered users -->
          <p v-if="profileData.username" class="text-sm text-surface-400">
            @{{ profileData.username }}
          </p>
          <p class="profile-identity__rating">{{ profileData.elo }} <span>Elo</span></p>
        </div>
      </div>

      <!-- Competitive Tournament Stats -->
      <div v-if="profileData.tournament_stats" class="space-y-3">
        <h3 class="text-sm font-semibold text-surface-400 uppercase tracking-wider">
          Competitive Record
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Tournaments</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.tournaments_joined }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Championships</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.championships }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Best Finish</div>
            <div class="text-lg font-bold text-surface-50 capitalize">
              {{ formatBestFinish(profileData.tournament_stats.best_finish) }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Matches Played</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.matches_played }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Matches Won</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.matches_won }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Win Rate</div>
            <div class="text-lg font-bold text-surface-50">
              {{ formatWinRate(profileData.tournament_stats.win_rate) }}
            </div>
          </GlassCard>
        </div>
      </div>

      <!-- Global Stats -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-surface-400 uppercase tracking-wider">
          Global Statistics
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Matches</div>
            <div class="font-medium text-surface-100">
              {{ profileData.global_stats.matches_played }}
            </div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Wins</div>
            <div class="font-medium text-success-400">{{ profileData.global_stats.wins }}</div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Losses</div>
            <div class="font-medium text-danger-400">{{ profileData.global_stats.losses }}</div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Win Rate</div>
            <div class="font-medium text-surface-100">
              {{ formatGlobalWinRate(profileData.global_stats) }}
            </div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Max Streak</div>
            <div class="font-medium text-warning-400">
              {{ profileData.global_stats.max_streak }}
            </div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Coins</div>
            <div class="font-medium text-warning-400">{{ profileData.global_stats.coins }}</div>
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div v-if="profileData.achievements && profileData.achievements.length > 0" class="space-y-3">
        <h3 class="text-sm font-semibold text-surface-400 uppercase tracking-wider">
          Achievements
        </h3>
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="ach in profileData.achievements"
            :key="ach.achievement_id"
            class="bg-surface-800/30 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-2 group relative"
          >
            <component
              :is="getAchievementIcon(ach.achievement_id)"
              class="w-6 h-6 text-primary-400"
            />
            <div class="text-[10px] text-surface-300 leading-tight">
              {{ formatAchievementName(ach.achievement_id) }}
            </div>

            <!-- Tooltip -->
            <div
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-surface-900 text-surface-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
            >
              Unlocked: {{ new Date(ach.unlocked_at).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useUserProfile } from '@/composables/useUserProfile'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import RankFrame from '@/components/RankFrame.vue'
import { computed } from 'vue'
import { getRankSubTier, getRankTier } from '@/config/ranks'
import type { UserStats } from '@/api/users'
import { Trophy, Star, Flame, Award, Crown, Swords, Medal, Users } from 'lucide-vue-next'

const { isProfileModalOpen, profileData, isLoadingProfile, profileError, closeProfile } =
  useUserProfile()

const profileTier = computed(() => getRankTier(profileData.value?.elo ?? 0))
const profileRankLabel = computed(() => {
  const elo = profileData.value?.elo ?? 0
  return `${profileTier.value.name} ${getRankSubTier(elo)}`.trim()
})

const getAchievementIcon = (id: string) => {
  switch (id) {
    case 'first_win':
      return Star
    case 'win_streak_5':
      return Flame
    case 'ranked_50_wins':
      return Award
    case 'ranked_100_wins':
      return Crown
    case 'first_tournament':
      return Swords
    case 'first_tournament_win':
      return Medal
    case 'tournament_champion':
      return Trophy
    case 'first_friend':
      return Users
    default:
      return Star
  }
}

const formatAchievementName = (id: string) => {
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatWinRate = (rate: number) => {
  if (!rate && rate !== 0) return '0%'
  return `${String(Math.round(rate * 100))}%`
}

const formatGlobalWinRate = (stats: UserStats) => {
  if (stats.matches_played === 0) return '0%'
  return `${String(Math.round((stats.wins / stats.matches_played) * 100))}%`
}

const formatBestFinish = (finish: string) => {
  if (!finish) return '-'
  return finish.split('_').join(' ')
}
</script>

<style scoped>
.profile-identity {
  --profile-rank: var(--color-rank-iron);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-iron) 48%, white);
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  overflow: hidden;
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--profile-rank) 58%, var(--color-rank-gold));
  background:
    radial-gradient(
      circle at 15% 45%,
      color-mix(in srgb, var(--profile-rank) 18%, transparent),
      transparent 38%
    ),
    linear-gradient(
      118deg,
      color-mix(in srgb, var(--color-rank-panel) 96%, white),
      var(--color-rank-panel-deep)
    );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--profile-rank-highlight) 22%, transparent),
    inset 0 -0.25rem 0 rgb(0 0 0 / 0.2),
    var(--shadow-card);
  clip-path: polygon(
    0 var(--radius-md),
    var(--radius-md) 0,
    calc(100% - var(--radius-md)) 0,
    100% var(--radius-md),
    100% calc(100% - var(--radius-md)),
    calc(100% - var(--radius-md)) 100%,
    var(--radius-md) 100%,
    0 calc(100% - var(--radius-md))
  );
}

.profile-identity[data-rank-tier='bronze'] {
  --profile-rank: var(--color-rank-bronze);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-bronze) 58%, white);
}

.profile-identity[data-rank-tier='silver'] {
  --profile-rank: var(--color-rank-silver);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-silver) 52%, white);
}

.profile-identity[data-rank-tier='gold'] {
  --profile-rank: var(--color-rank-gold);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-gold-warm) 58%, white);
}

.profile-identity[data-rank-tier='diamond'] {
  --profile-rank: var(--color-rank-diamond);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-diamond) 50%, white);
}

.profile-identity::after {
  position: absolute;
  inset: 0.375rem;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--profile-rank) 20%, transparent);
  content: '';
  clip-path: inherit;
}

.profile-identity__copy {
  min-width: 0;
}

.profile-identity__eyebrow {
  color: var(--profile-rank-highlight);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-shadow: 0 0 0.6rem color-mix(in srgb, var(--profile-rank) 40%, transparent);
  text-transform: uppercase;
}

.profile-identity__name {
  overflow: hidden;
  margin-top: 0.25rem;
  color: var(--color-foreground);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-section);
  font-weight: 700;
  line-height: var(--text-section--line-height);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-identity__rating {
  margin-top: 0.5rem;
  color: var(--color-rank-gold-warm);
  font-size: var(--text-card);
  font-weight: 800;
}

.profile-identity__rating span {
  color: var(--color-foreground-muted);
  font-size: var(--text-caption);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 39.99rem) {
  .profile-identity {
    gap: 1rem;
    padding: 1rem;
  }
  .profile-identity :deep(.rank-frame[data-size='xl']) {
    width: 5rem;
    height: 5rem;
  }
  .profile-identity__name {
    font-size: var(--text-card);
    line-height: var(--text-card--line-height);
  }
}
</style>
