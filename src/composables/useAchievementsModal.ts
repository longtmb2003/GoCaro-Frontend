import { ref } from 'vue'

const isAchievementsModalOpen = ref(false)

export function useAchievementsModal() {
  const openAchievements = () => {
    isAchievementsModalOpen.value = true
  }

  const closeAchievements = () => {
    isAchievementsModalOpen.value = false
  }

  return {
    isAchievementsModalOpen,
    openAchievements,
    closeAchievements
  }
}
