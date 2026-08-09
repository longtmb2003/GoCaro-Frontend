<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { http } from '@/api/http'
import { useAchievementRewards } from '@/composables/useAchievementRewards'
import { Loader2, CheckCircle2, Lock, Gift, Coins } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import GlassCard from '@/components/ui/GlassCard.vue'

import { ACHIEVEMENTS } from '@/config/achievements'

const { language, t } = useAppLanguage()
const authStore = useAuthStore()

interface UserAchievement {
  achievement_id: string
  unlocked_at: string
}

interface UserProfile {
  achievements: UserAchievement[]
}

const loading = ref(true)
const userAchievements = ref<UserAchievement[]>([])
const { load: loadRewards, rewardName, rewardCoins } = useAchievementRewards()

onMounted(async () => {
  if (!authStore.user) {
    loading.value = false
    return
  }

  // The reward lookup never rejects, so a catalogue outage costs the reward
  // line and leaves the achievement list intact.
  const [profile] = await Promise.allSettled([
    http.get<UserProfile>(`/api/users/${authStore.user.id}/profile`),
    loadRewards(),
  ])

  if (profile.status === 'fulfilled') {
    userAchievements.value = profile.value.data.achievements
  } else {
    console.error('Failed to fetch achievements', profile.reason)
  }

  loading.value = false
})

function isUnlocked(id: string) {
  return userAchievements.value.some(a => a.achievement_id === id)
}

function getUnlockedAt(id: string) {
  const ach = userAchievements.value.find(a => a.achievement_id === id)
  if (!ach) return ''
  // The rest of the app pins the locale to the chosen language rather than the
  // browser's, so a Vietnamese reader does not get an en-US date.
  return new Date(ach.unlocked_at).toLocaleDateString(language.value === 'vi' ? 'vi-VN' : 'en-US')
}
</script>

<template>
  <AppLayout :title="t('Achievements', 'Thành tựu')" fantasy>
    <div class="achievements-container">
      <h1 class="achievements-title">{{ t('Achievements', 'Thành tựu') }}</h1>

      <div v-if="loading" class="achievements-loading">
        <Loader2 class="animate-spin text-warning-400" :size="32" />
      </div>

      <div v-else class="achievements-grid">
        <GlassCard
          v-for="ach in ACHIEVEMENTS"
          :key="ach.id"
          as="div"
          class="achievement-card"
          :class="{ 'achievement-card--locked': !isUnlocked(ach.id) }"
        >
          <div class="achievement-card__icon" aria-hidden="true">
            <component :is="ach.icon" :size="22" />
          </div>

          <div class="achievement-card__body">
            <h3 class="achievement-card__name">{{ ach.name[language] }}</h3>
            <p class="achievement-card__description">{{ ach.desc[language] }}</p>
            <p v-if="rewardCoins(ach.id) || rewardName(ach.id)" class="achievement-card__reward">
              <span v-if="rewardCoins(ach.id)" class="achievement-card__reward-part">
                <Coins :size="12" aria-hidden="true" />
                +{{ rewardCoins(ach.id) }} {{ t('coins', 'xu') }}
              </span>
              <span v-if="rewardName(ach.id)" class="achievement-card__reward-part">
                <Gift :size="12" aria-hidden="true" />
                {{ rewardName(ach.id) }}
              </span>
            </p>
          </div>

          <div class="achievement-card__status">
            <CheckCircle2 v-if="isUnlocked(ach.id)" class="achievement-card__unlocked-icon" :size="20" />
            <Lock v-else class="achievement-card__locked-icon" :size="20" />
            <span v-if="isUnlocked(ach.id)" class="achievement-card__date">{{ getUnlockedAt(ach.id) }}</span>
          </div>
        </GlassCard>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.achievements-container {
  max-width: 62.5rem;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg) var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.achievements-title {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-hero);
  font-weight: 700;
  color: var(--color-fantasy-stone);
  margin: 0;
}

.achievements-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-2xl) 0;
}

.achievements-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .achievements-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-color: var(--color-fantasy-gold);
  transition: border-color var(--transition-duration-normal) ease;
}

/* Locked entries stay legible rather than dimmed to the point of guessing:
   the border drops to the neutral tone and only the icon is muted. */
.achievement-card--locked {
  border-color: var(--color-fantasy-border-subtle);
}

.achievement-card__icon {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-section);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-fantasy-gold) 16%, transparent);
}

.achievement-card--locked .achievement-card__icon {
  background: var(--surface-sunken);
  filter: grayscale(1);
  opacity: 0.55;
}

.achievement-card__body {
  flex: 1;
  min-width: 0;
}

.achievement-card__name {
  font-family: 'Cinzel', serif;
  font-size: var(--text-body);
  font-weight: 700;
  color: var(--color-fantasy-stone);
  margin: 0;
}

.achievement-card__description {
  font-size: var(--text-caption);
  color: var(--text-muted);
  margin: 0;
}

.achievement-card__reward {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-md);
  margin: var(--space-xs) 0 0;
  font-size: var(--text-caption);
  font-weight: 700;
  color: var(--color-fantasy-gold);
}

.achievement-card__reward-part {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.achievement-card--locked .achievement-card__reward {
  opacity: 0.7;
}

.achievement-card__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.achievement-card__unlocked-icon {
  color: var(--color-fantasy-gold);
}

.achievement-card__locked-icon {
  color: var(--text-muted);
}

.achievement-card__date {
  font-size: var(--text-caption);
  font-family: var(--font-mono);
  color: var(--text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .achievement-card {
    transition: none;
  }
}
</style>
