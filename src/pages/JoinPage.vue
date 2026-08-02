<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { acceptOpenChallenge } from '@/api/challenge'
import { ApiError } from '@/api/ApiError'
import AppLayout from '@/layouts/AppLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { useSocketStore } from '@/stores/socket'

const route = useRoute()
const router = useRouter()
const socketStore = useSocketStore()

const code = route.params.code as string

const status = ref<'accepting' | 'connecting' | 'error'>('accepting')
const errorMessage = ref<string | null>(null)
const acceptPending = ref(false)

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INVITE_CODE: "This invite link has expired or doesn't exist.",
  OPPONENT_OFFLINE: 'The host is no longer online. Ask them to create a new link.',
  OPPONENT_BUSY: 'The host is already in a match.',
  CHALLENGER_BUSY: 'You are already in a match. Finish it first.',
  CANNOT_CHALLENGE_SELF: "You can't join your own room.",
}

onMounted(() => {
  if (!code) {
    status.value = 'error'
    errorMessage.value = 'Invalid link.'
    return
  }
  void handleAccept()
})

async function handleAccept() {
  if (acceptPending.value) return
  acceptPending.value = true
  status.value = 'accepting'
  errorMessage.value = null
  
  try {
    await acceptOpenChallenge(code)
    status.value = 'connecting'
    socketStore.startMatchmaking('casual')
    // Once match_found is received, LobbyPage / App router will push to /game
    // If there is an error in socket, it's handled in MatchmakingModal or we can catch it here if we want.
    // For simplicity, we just navigate to lobby where MatchmakingModal takes over.
    void router.push('/')
  } catch (err: unknown) {
    status.value = 'error'
    if (err instanceof ApiError) {
      errorMessage.value = ERROR_MESSAGES[err.code] || err.message
    } else {
      errorMessage.value = 'Something went wrong.'
    }
  } finally {
    acceptPending.value = false
  }
}
</script>

<template>
  <AppLayout title="Join Match">
    <div class="flex items-center justify-center min-h-[50vh]">
      <div v-if="status === 'accepting' || status === 'connecting'" class="text-center space-y-4">
        <BaseSpinner size="lg" class="mx-auto" />
        <h2 class="text-card text-foreground">
          {{ status === 'accepting' ? 'Joining room...' : 'Connecting to match...' }}
        </h2>
      </div>

      <div v-else-if="status === 'error'" class="w-full max-w-md">
        <ErrorState :message="errorMessage ?? 'Failed to join match.'">
          <template #action>
            <BaseButton variant="secondary" @click="router.push('/')"> Back to Lobby </BaseButton>
          </template>
        </ErrorState>
      </div>
    </div>
  </AppLayout>
</template>
