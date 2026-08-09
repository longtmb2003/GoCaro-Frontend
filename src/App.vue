<script setup lang="ts">
import { RouterView } from 'vue-router'
import { watch } from 'vue'
import { checkServerAvailability, useServerAvailability } from '@/api/serverAvailability'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import ServerMaintenancePage from '@/pages/ServerMaintenancePage.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import AchievementsModal from '@/components/AchievementsModal.vue'
import GlobalMatchmakingTracker from '@/components/GlobalMatchmakingTracker.vue'
import ReadyCheckModal from '@/components/ReadyCheckModal.vue'
import { useSocketStore } from '@/stores/socket'

const auth = useAuthStore()
const social = useSocialStore()
// The ready check lives here rather than on the lobby: a player can be queued
// from several pages, and the offer has to reach them wherever they are.
const socket = useSocketStore()
const serverAvailability = useServerAvailability()

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

    <UserProfileModal />
    <AchievementsModal />
    <GlobalMatchmakingTracker />
    <ReadyCheckModal
      v-if="socket.proposal"
      :proposal="socket.proposal"
      :seconds-left="socket.proposalSecondsLeft"
      @accept="socket.acceptMatch()"
      @decline="socket.declineMatch()"
    />
  </template>
</template>
