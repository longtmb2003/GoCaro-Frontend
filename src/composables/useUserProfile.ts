import { ref } from 'vue'
import { fetchPublicProfile, type PublicProfile } from '@/api/users'

// Global state for the profile modal
const isProfileModalOpen = ref(false)
const currentProfileId = ref<string | null>(null)
const profileData = ref<PublicProfile | null>(null)
const isLoadingProfile = ref(false)
const profileError = ref<string | null>(null)

interface CachedProfile {
  data: PublicProfile
  timestamp: number
}
const profileCache = new Map<string, CachedProfile>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function useUserProfile() {
  const openProfile = async (userId: string) => {
    isProfileModalOpen.value = true
    currentProfileId.value = userId
    isLoadingProfile.value = true
    profileError.value = null
    
    const now = Date.now()
    const cached = profileCache.get(userId)
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      profileData.value = cached.data
      isLoadingProfile.value = false
      return
    }

    try {
      const data = await fetchPublicProfile(userId)
      profileCache.set(userId, { data, timestamp: now })
      profileData.value = data
    } catch (err: any) {
      profileError.value = err.response?.data?.error?.message || 'Failed to load profile'
    } finally {
      isLoadingProfile.value = false
    }
  }

  const closeProfile = () => {
    isProfileModalOpen.value = false
    // We intentionally don't clear profileData immediately so it can animate out nicely
    setTimeout(() => {
      if (!isProfileModalOpen.value) {
        currentProfileId.value = null
        profileData.value = null
      }
    }, 300)
  }

  return {
    isProfileModalOpen,
    currentProfileId,
    profileData,
    isLoadingProfile,
    profileError,
    openProfile,
    closeProfile
  }
}
