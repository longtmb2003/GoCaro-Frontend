<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2 mb-2">
      <Activity class="w-5 h-5 text-primary-400" />
      <h3 class="text-lg font-display font-semibold text-surface-50">Friend Activity</h3>
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <BaseSpinner class="text-primary-400" />
    </div>

    <div v-else-if="error" class="text-center py-6">
      <p class="text-danger-400 text-sm">{{ error }}</p>
    </div>

    <div v-else-if="activities.length === 0" class="text-center py-6 bg-surface-800/20 rounded-lg border border-surface-700/50">
      <p class="text-surface-400 text-sm">No recent activity from your friends.</p>
    </div>

    <div v-else class="space-y-3">
      <GlassCard 
        v-for="activity in activities" 
        :key="activity.id"
        as="div"
        variant="nested"
        class="p-3 flex items-start gap-3 transition-colors hover:bg-surface-800/60"
      >
        <div class="mt-0.5 shrink-0">
          <component :is="getIconForActivity(activity)" class="w-5 h-5" :class="getColorForActivity(activity)" />
        </div>
        
        <div class="flex-1 min-w-0">
          <p class="text-sm text-surface-200">
            <span class="font-semibold text-surface-50 hover:text-primary-400 cursor-pointer transition-colors" @click="openProfile(activity.user_id)">
              {{ activity.display_name }}
            </span>
            {{ getActivityMessage(activity) }}
          </p>
          <p class="text-xs text-surface-400 mt-1">
            {{ formatTimeAgo(activity.created_at) }}
          </p>
        </div>
      </GlassCard>
    </div>
    
    <UserProfileModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Trophy, Star, Swords, Activity, Flame, Medal, Award, Crown, Users } from 'lucide-vue-next'
import { fetchActivityFeed, type UserActivity } from '@/api/users'
import GlassCard from '@/components/ui/GlassCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import { useUserProfile } from '@/composables/useUserProfile'

const { openProfile } = useUserProfile()

const activities = ref<UserActivity[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const loadActivities = async () => {
  isLoading.value = true
  error.value = null
  try {
    activities.value = await fetchActivityFeed()
  } catch (err: any) {
    console.error('Failed to load activity feed:', err)
    error.value = 'Could not load activity feed'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadActivities()
  window.addEventListener('gocaro:activity_feed_updated', loadActivities)
})

onUnmounted(() => {
  window.removeEventListener('gocaro:activity_feed_updated', loadActivities)
})

const getIconForActivity = (activity: UserActivity) => {
  switch (activity.activity_type) {
    case 'achievement_unlocked':
      switch (activity.metadata.achievement_id) {
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
    case 'tournament_champion':
      return Trophy
    case 'tournament_joined':
      return Swords
    default:
      return Activity
  }
}

const getColorForActivity = (activity: UserActivity) => {
  switch (activity.activity_type) {
    case 'achievement_unlocked':
      return 'text-warning-400'
    case 'tournament_champion':
      return 'text-primary-400'
    case 'tournament_joined':
      return 'text-surface-300'
    default:
      return 'text-surface-400'
  }
}

const getActivityMessage = (activity: UserActivity) => {
  switch (activity.activity_type) {
    case 'achievement_unlocked':
      const name = activity.metadata.achievement_id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      return ` unlocked the achievement "${name}"!`
    case 'tournament_champion':
      return ` won a tournament!`
    case 'tournament_joined':
      return ` joined a tournament.`
    default:
      return ` performed an activity.`
  }
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}
</script>
