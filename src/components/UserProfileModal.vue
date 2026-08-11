<template>
  <BaseModal
    v-if="isProfileModalOpen"
    :title="t('Player Profile', 'Hồ sơ người chơi')"
    size="md"
    variant="fantasy"
    @close="closeProfile"
  >
    <div v-if="isLoadingProfile" class="flex justify-center items-center py-12">
      <BaseSpinner class="text-primary-400" />
    </div>

    <div v-else-if="profileError" class="text-center py-8">
      <p class="text-danger-400 mb-4">{{ errorText(profileError) }}</p>
      <BaseButton variant="secondary" @click="closeProfile">{{ t('Close', 'Đóng') }}</BaseButton>
    </div>

    <div v-else-if="profileData" class="space-y-6">
      <!-- Header: Avatar & Basic Info -->
      <div class="profile-identity" :data-rank-tier="profileTier.name.toLowerCase()">
        <div class="profile-identity__avatar" :class="profileData.profile_frame">
          <BaseAvatar :name="profileData.display_name" size="xl" :online="isUserOnline" />
          <RankFrame
            class="profile-identity__rank-logo"
            :elo="profileData.elo"
            :initial="profileData.display_name.charAt(0).toUpperCase()"
            size="game"
          />
        </div>
        <div class="profile-identity__copy flex-1 min-w-0">
          <p class="profile-identity__eyebrow">{{ profileRankLabel }}</p>
          <h2 class="profile-identity__name flex items-center gap-2">
            <span>{{ profileData.display_name }}</span>
            <span v-if="profileData.title" class="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize align-middle">
              {{ formatTitle(profileData.title) }}
            </span>
          </h2>
          <!-- Show the handle for all registered users -->
          <p v-if="profileData.username" class="text-sm text-surface-400">
            @{{ profileData.username }}
          </p>
          <p class="profile-identity__rating">{{ profileData.elo }} <span>Elo</span></p>
          <FriendRequestButton
            v-if="profileData.id !== auth.user?.id"
            class="profile-identity__friend"
            :user-id="profileData.id"
            :display-name="profileData.display_name"
          />
        </div>

        <div v-if="equippedSpirit" class="profile-identity__companion flex flex-col items-center gap-1 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 shadow-md shrink-0">
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-300">{{ t('Active Companion', 'Đồng hành') }}</span>
          <img :src="equippedSpirit.source" :alt="equippedSpirit.name" class="w-12 h-12 object-contain filter drop-shadow-md" />
          <span class="text-xs font-serif font-bold text-[var(--color-fantasy-stone)]">{{ equippedSpirit.name }}</span>
        </div>
      </div>

      <!-- Competitive Tournament Stats -->
      <div v-if="profileData.tournament_stats" class="space-y-3">
        <h3 class="text-sm font-semibold text-surface-400 uppercase tracking-wider">
          {{ t('Competitive Record', 'Thành tích thi đấu') }}
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">{{ t('Tournaments', 'Giải đấu') }}</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.tournaments_joined }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">{{ t('Championships', 'Chức vô địch') }}</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.championships }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">{{ t('Best Finish', 'Thành tích tốt nhất') }}</div>
            <div class="text-lg font-bold text-surface-50 capitalize">
              {{ formatBestFinish(profileData.tournament_stats.best_finish) }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">{{ t('Matches Played', 'Số trận đã chơi') }}</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.matches_played }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">{{ t('Matches Won', 'Số trận thắng') }}</div>
            <div class="text-lg font-bold text-surface-50">
              {{ profileData.tournament_stats.matches_won }}
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">{{ t('Win Rate', 'Tỷ lệ thắng') }}</div>
            <div class="text-lg font-bold text-surface-50">
              {{ formatWinRate(profileData.tournament_stats.win_rate) }}
            </div>
          </GlassCard>
        </div>
      </div>

      <!-- Global Stats -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-surface-400 uppercase tracking-wider">
          {{ t('Global Statistics', 'Thống kê tổng') }}
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">{{ t('Matches', 'Trận đấu') }}</div>
            <div class="font-medium text-surface-100">
              {{ profileData.global_stats.matches_played }}
            </div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">{{ t('Wins', 'Thắng') }}</div>
            <div class="font-medium text-success-400">{{ profileData.global_stats.wins }}</div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">{{ t('Losses', 'Thua') }}</div>
            <div class="font-medium text-danger-400">{{ profileData.global_stats.losses }}</div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">{{ t('Win Rate', 'Tỷ lệ thắng') }}</div>
            <div class="font-medium text-surface-100">
              {{ formatGlobalWinRate(profileData.global_stats) }}
            </div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">{{ t('Max Streak', 'Chuỗi thắng cao nhất') }}</div>
            <div class="font-medium text-warning-400">
              {{ profileData.global_stats.max_streak }}
            </div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">{{ t('Coins', 'Xu') }}</div>
            <div class="font-medium text-warning-400">{{ profileData.global_stats.coins }}</div>
          </div>
        </div>
      </div>

      <!-- Achievements Button -->
      <div class="pt-2">
        <BaseButton
          variant="secondary"
          class="w-full flex items-center justify-center gap-2 py-3"
          @click="openAchievements()"
        >
          <Trophy class="w-4 h-4 text-primary-400" />
          {{ t('View All Achievements', 'Xem tất cả Thành tựu') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useUserProfile } from '@/composables/useUserProfile'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import FriendRequestButton from '@/components/FriendRequestButton.vue'
import RankFrame from '@/components/RankFrame.vue'
import { computed } from 'vue'
import { getRankSubTier, getRankTier } from '@/config/ranks'
import type { UserStats } from '@/api/users'
import { Trophy } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useLobbyStore } from '@/stores/lobby'
import { useShopStore } from '@/stores/shop'
import { resolveSpirit } from '@/spirits/spiritRegistry'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAchievementsModal } from '@/composables/useAchievementsModal'

const { isProfileModalOpen, profileData, isLoadingProfile, profileError, closeProfile } =
  useUserProfile()
const auth = useAuthStore()
const lobby = useLobbyStore()
const shopStore = useShopStore()
const { errorText, language, rankName, t } = useAppLanguage()
const { openAchievements } = useAchievementsModal()

const isUserOnline = computed(() => {
  const profile = profileData.value
  if (!profile) return false
  if (profile.id === auth.user?.id) return true
  return lobby.onlineUsers.some(u => u.id === profile.id)
})

const equippedSpirit = computed(() => {
  if (!profileData.value) return null
  let code: string | null
  if (profileData.value.id === auth.user?.id) {
    code = shopStore.getEquipped('spirit_art')
  } else {
    // Strictly read from the target user's profile data — never fallback to current user's equipment
    code = profileData.value.equipped_spirit || null
  }
  if (!code) return null
  const spirit = resolveSpirit(code, null, { withArt: true })
  if (!spirit.model.source) return null
  const langKey = language.value
  return {
    code,
    name: spirit.name[langKey],
    source: spirit.model.source,
  }
})

const profileTier = computed(() => getRankTier(profileData.value?.elo ?? 0))
const profileRankLabel = computed(() => {
  const elo = profileData.value?.elo ?? 0
  return `${rankName(profileTier.value.name)} ${getRankSubTier(elo)}`.trim()
})

const formatWinRate = (rate: number) => {
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

const formatTitle = (titleCode: string) => {
  if (!titleCode) return ''
  return titleCode.replace('title_', '').split('_').join(' ')
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
  border-radius: var(--radius-card);
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
  border-radius: calc(var(--radius-card) - 0.375rem);
  content: '';
}

.profile-identity__avatar {
  position: relative;
  display: grid;
  width: 5.5rem;
  height: 5.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--profile-rank) 62%, var(--color-rank-gold));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-rank-panel-deep) 88%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--profile-rank-highlight) 24%, transparent),
    0 0 1rem color-mix(in srgb, var(--profile-rank) 16%, transparent);
}

.profile-identity__rank-logo {
  position: absolute;
  right: calc(var(--space-sm) * -1);
  bottom: calc(var(--space-sm) * -1);
  z-index: 2;
  filter: drop-shadow(0 0 var(--space-sm) color-mix(in srgb, var(--profile-rank) 36%, transparent));
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

.profile-identity__friend {
  margin-top: 0.75rem;
}

@media (max-width: 39.99rem) {
  .profile-identity {
    gap: 1rem;
    padding: 1rem;
  }
  .profile-identity__avatar {
    width: 4.75rem;
    height: 4.75rem;
  }
  .profile-identity__name {
    font-size: var(--text-card);
    line-height: var(--text-card--line-height);
  }
}
</style>
