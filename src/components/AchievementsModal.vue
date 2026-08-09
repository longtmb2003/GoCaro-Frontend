<template>
  <BaseModal
    v-if="isAchievementsModalOpen"
    :title="t('All Achievements', 'Tất cả Thành tựu')"
    size="lg"
    variant="fantasy"
    @close="closeAchievements"
  >
    <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
      <div
        v-for="ach in ACHIEVEMENTS"
        :key="ach.id"
        :class="[
          'bg-surface-800/30 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3 group relative transition-all duration-300 hover:bg-surface-800/50 border border-transparent hover:border-surface-700/50 hover:z-50',
          isUnlocked(ach.id) ? '' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
        ]"
      >
        <component
          :is="ach.icon"
          class="w-10 h-10 text-primary-400 drop-shadow-glow"
        />
        <div class="text-xs font-semibold text-surface-200 leading-tight">
          {{ ach.name[language as 'en' | 'vi'] }}
        </div>

        <!-- Tooltip -->
        <div
          class="absolute top-[105%] left-1/2 -translate-x-1/2 mt-2 w-[220px] px-3 py-2 bg-surface-900/95 backdrop-blur-sm text-surface-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl border border-surface-700/50 whitespace-normal"
        >
          <div class="font-bold text-primary-400 mb-1.5 text-sm">{{ ach.name[language as 'en' | 'vi'] }}</div>
          <div class="text-xs text-surface-300 mb-2">{{ ach.desc[language as 'en' | 'vi'] }}</div>
          <div v-if="rewardCoins(ach.id)" class="text-xs text-warning-400 font-bold mb-1 flex items-center justify-center gap-1">
            +{{ rewardCoins(ach.id) }} {{ t('Coins', 'Xu') }}
          </div>
          <div v-if="rewardName(ach.id)" class="text-xs text-warning-400 font-bold mb-2 flex items-center justify-center gap-1">
            {{ t('Unlocks', 'Mở khóa') }}: {{ rewardName(ach.id) }}
          </div>
          <div v-if="isUnlocked(ach.id)" class="text-[10px] text-success-400 font-medium bg-success-900/20 py-1 rounded">
            {{ t('Unlocked', 'Mở khóa') }}: {{ getUnlockedDate(ach.id) }}
          </div>
          <div v-else class="text-[10px] text-surface-400 font-medium bg-surface-800/50 py-1 rounded">
            {{ t('Locked', 'Chưa mở khóa') }}
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useAchievementsModal } from '@/composables/useAchievementsModal'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAchievementRewards } from '@/composables/useAchievementRewards'
import BaseModal from '@/components/ui/BaseModal.vue'
import { ACHIEVEMENTS } from '@/config/achievements'
import { onMounted } from 'vue'

const { isAchievementsModalOpen, closeAchievements } = useAchievementsModal()
const { profileData } = useUserProfile()
const { t, language } = useAppLanguage()
const { load: loadRewards, rewardName, rewardCoins } = useAchievementRewards()

onMounted(() => {
  void loadRewards()
})

const isUnlocked = (achId: string) => {
  return profileData.value?.achievements?.find((a) => a.achievement_id === achId)
}

const getUnlockedDate = (achId: string) => {
  const ach = isUnlocked(achId)
  if (!ach) return null
  return new Date(ach.unlocked_at).toLocaleDateString(language.value === 'vi' ? 'vi-VN' : 'en-US')
}
</script>

<style scoped>
.drop-shadow-glow {
  filter: drop-shadow(0 0 8px rgba(107, 227, 255, 0.4));
}
</style>
