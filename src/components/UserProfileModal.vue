<template>
  <BaseModal v-if="isProfileModalOpen" @close="closeProfile" title="Player Profile">
    <div v-if="isLoadingProfile" class="flex justify-center items-center py-12">
      <BaseSpinner class="text-primary-400" />
    </div>

    <div v-else-if="profileError" class="text-center py-8">
      <p class="text-danger-400 mb-4">{{ profileError }}</p>
      <BaseButton variant="secondary" @click="closeProfile">Close</BaseButton>
    </div>

    <div v-else-if="profileData" class="space-y-6">
      <!-- Header: Avatar & Basic Info -->
      <div class="flex items-center gap-4 border-b border-surface-700/50 pb-6">
        <BaseAvatar :name="profileData.display_name" size="lg" />
        <div>
          <h2 class="text-2xl font-bold text-surface-50 font-display">
            {{ profileData.display_name }}
          </h2>
          <!-- Full names are not unique, so the handle is shown whenever it is
               not already the name, to tell two players of the same name apart. -->
          <p v-if="profileData.full_name" class="text-sm text-surface-400">
            @{{ profileData.username }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-primary-400 font-bold">Rating: {{ profileData.elo }}</span>
            <RankFrame :elo="profileData.elo" :initial="profileData.display_name.charAt(0).toUpperCase()" />
          </div>
        </div>
      </div>

      <!-- Competitive Tournament Stats -->
      <div v-if="profileData.tournament_stats" class="space-y-3">
        <h3 class="text-sm font-semibold text-surface-400 uppercase tracking-wider">
          Competitive Record
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Tournaments</div>
            <div class="text-lg font-bold text-surface-50">{{ profileData.tournament_stats.tournaments_joined }}</div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Championships</div>
            <div class="text-lg font-bold text-surface-50">{{ profileData.tournament_stats.championships }}</div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Win Rate</div>
            <div class="text-lg font-bold text-surface-50">
              {{ formatWinRate(profileData.tournament_stats.win_rate) }}
            </div>
            <div class="text-xs text-surface-500 mt-0.5">
              {{ profileData.tournament_stats.matches_won }}W - {{ profileData.tournament_stats.matches_played - profileData.tournament_stats.matches_won }}L
            </div>
          </GlassCard>
          <GlassCard as="div" variant="nested" class="p-3 text-center">
            <div class="text-surface-400 text-xs">Best Finish</div>
            <div class="text-lg font-bold text-surface-50 capitalize">
              {{ formatBestFinish(profileData.tournament_stats.best_finish) }}
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
            <div class="font-medium text-surface-100">{{ profileData.global_stats.matches_played }}</div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Wins</div>
            <div class="font-medium text-success-400">{{ profileData.global_stats.wins }}</div>
          </div>
          <div class="bg-surface-800/30 rounded-lg p-2 text-center">
            <div class="text-surface-400 text-xs">Losses</div>
            <div class="font-medium text-danger-400">{{ profileData.global_stats.losses }}</div>
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
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-surface-900 text-surface-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
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
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import RankFrame from '@/components/RankFrame.vue'
import { Trophy, Star, Flame, Award, Crown, Swords, Medal, Users } from 'lucide-vue-next'

const { isProfileModalOpen, profileData, isLoadingProfile, profileError, closeProfile } = useUserProfile()

const getAchievementIcon = (id: string) => {
  switch (id) {
    case 'first_win': return Star
    case 'win_streak_5': return Flame
    case 'ranked_50_wins': return Award
    case 'ranked_100_wins': return Crown
    case 'first_tournament': return Swords
    case 'first_tournament_win': return Medal
    case 'tournament_champion': return Trophy
    case 'first_friend': return Users
    default: return Star
  }
}

const formatAchievementName = (id: string) => {
  return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const formatWinRate = (rate: number) => {
  if (!rate && rate !== 0) return '0%'
  return `${Math.round(rate * 100)}%`
}

const formatBestFinish = (finish: string) => {
  if (!finish) return '-'
  return finish.split('_').join(' ')
}
</script>
