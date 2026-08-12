<script setup lang="ts">
import { RouterView } from 'vue-router'
import { defineAsyncComponent, watch } from 'vue'
import { checkServerAvailability, useServerAvailability } from '@/api/serverAvailability'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useSocketStore } from '@/stores/socket'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAchievementsModal } from '@/composables/useAchievementsModal'

const ServerMaintenancePage = defineAsyncComponent(
  () => import('@/pages/ServerMaintenancePage.vue'),
)
const UserProfileModal = defineAsyncComponent(() => import('@/components/UserProfileModal.vue'))
const AchievementsModal = defineAsyncComponent(() => import('@/components/AchievementsModal.vue'))
const GlobalMatchmakingTracker = defineAsyncComponent(
  () => import('@/components/GlobalMatchmakingTracker.vue'),
)
const ReadyCheckModal = defineAsyncComponent(() => import('@/components/ReadyCheckModal.vue'))

const auth = useAuthStore()
const social = useSocialStore()
// The ready check lives here rather than on the lobby: a player can be queued
// from several pages, and the offer has to reach them wherever they are.
const socket = useSocketStore()
const serverAvailability = useServerAvailability()
const { isProfileModalOpen } = useUserProfile()
const { isAchievementsModalOpen } = useAchievementsModal()

watch(
  [() => auth.token, () => serverAvailability.isUnavailable.value],
  ([newToken, serverUnavailable]) => {
    if (newToken && !serverUnavailable) {
      social.connect(newToken)
    } else {
      social.disconnect()
    }
  },
  { immediate: true },
)

async function retryConnection(): Promise<void> {
  const isReady = await checkServerAvailability()
  if (isReady) {
    window.location.reload()
  }
}
</script>

<template>
  <ServerMaintenancePage
    v-if="serverAvailability.isUnavailable.value"
    :retrying="serverAvailability.isChecking.value"
    @retry="retryConnection"
  />

  <template v-else>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <UserProfileModal v-if="isProfileModalOpen" />
    <AchievementsModal v-if="isAchievementsModalOpen" />
    <GlobalMatchmakingTracker v-if="auth.isAuthenticated" />
    <ReadyCheckModal
      v-if="socket.proposal"
      :proposal="socket.proposal"
      :seconds-left="socket.proposalSecondsLeft"
      @accept="socket.acceptMatch()"
      @decline="socket.declineMatch()"
    />
  </template>
</template>
