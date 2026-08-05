<template>
  <div class="activity-feed">
    <div class="activity-feed__header">
      <FantasySystemIcon compact><Activity :size="18" /></FantasySystemIcon>
      <h3>Friend Activity</h3>
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <BaseSpinner class="text-primary-400" />
    </div>

    <div v-else-if="error" class="text-center py-6">
      <p class="text-danger-400 text-sm">{{ error }}</p>
    </div>

    <div v-else-if="activities.length === 0" class="activity-feed__empty">
      <p>No recent activity from your friends.</p>
    </div>

    <ul v-else class="activity-feed__list">
      <li v-for="activity in activities" :key="activity.id">
        <div class="activity-feed__icon">
          <FantasySystemIcon compact>
            <component
              :is="getIconForActivity(activity)"
              class="w-5 h-5"
              :class="getColorForActivity(activity)"
            />
          </FantasySystemIcon>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm text-surface-200">
            <button type="button" @click="openProfile(activity.user_id)">
              {{ activity.display_name }}
            </button>
            {{ getActivityMessage(activity) }}
          </p>
          <p class="text-xs text-surface-400 mt-1">
            {{ formatTimeAgo(activity.created_at) }}
          </p>
        </div>
      </li>
    </ul>

    <UserProfileModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Trophy, Star, Swords, Activity, Flame, Medal, Award, Crown, Users } from 'lucide-vue-next'
import { fetchActivityFeed, type UserActivity } from '@/api/users'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
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
  } catch {
    error.value = 'Could not load activity feed'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadActivities()
  window.addEventListener('gocaro:activity_feed_updated', handleActivityUpdate)
})

onUnmounted(() => {
  window.removeEventListener('gocaro:activity_feed_updated', handleActivityUpdate)
})

function handleActivityUpdate(): void {
  void loadActivities()
}

const getIconForActivity = (activity: UserActivity) => {
  switch (activity.activity_type) {
    case 'achievement_unlocked':
      switch (activity.metadata.achievement_id) {
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
    case 'achievement_unlocked': {
      const name = String(activity.metadata.achievement_id)
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return ` unlocked the achievement "${name}"!`
    }
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
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60).toString()}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600).toString()}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400).toString()}d ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.activity-feed__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.activity-feed__header svg {
  color: var(--color-accent);
}
.activity-feed__header h3 {
  color: var(--text-foreground);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-card);
  font-weight: 700;
}
.activity-feed__empty {
  padding: 1.5rem 0;
  color: var(--text-muted);
  font-size: var(--text-small);
  text-align: center;
}
.activity-feed__list {
  display: flex;
  flex-direction: column;
}
.activity-feed__list li {
  display: flex;
  gap: 0.75rem;
  padding: 0.625rem 0;
}
.activity-feed__list li + li {
  border-top: 1px solid var(--surface-border-subtle);
}
.activity-feed__icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--text-muted);
}
.activity-feed__list p {
  color: var(--text-secondary);
  font-size: var(--text-small);
  line-height: 1.4;
}
.activity-feed__list p + p {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.activity-feed__list button {
  color: var(--text-foreground);
  font-weight: 700;
  transition: color var(--transition-duration-fast) ease-out;
}
.activity-feed__list button:hover {
  color: var(--color-accent);
}
</style>
