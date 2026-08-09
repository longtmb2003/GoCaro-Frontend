<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { acceptOpenChallenge } from '@/api/challenge'
import AppLayout from '@/layouts/AppLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import TurnstileModal from '@/components/TurnstileModal.vue'
import { useSocketStore } from '@/stores/socket'
import { openChallengeErrorMessage } from '@/utils/openChallengeError'
import { useAppLanguage } from '@/composables/useAppLanguage'

const route = useRoute()
const router = useRouter()
const socketStore = useSocketStore()
const { errorText, t } = useAppLanguage()

const code = route.params.code as string

const status = ref<'accepting' | 'connecting' | 'error'>('accepting')
const errorMessage = ref<string | null>(null)
const acceptPending = ref(false)
const turnstileModalOpen = ref(false)

onMounted(() => {
  if (!code) {
    status.value = 'error'
    errorMessage.value = t('Invalid link.', 'Liên kết không hợp lệ.')
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
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      turnstileModalOpen.value = true
    } else {
      socketStore.startMatchmaking('casual')
      void router.push('/')
    }
  } catch (err: unknown) {
    status.value = 'error'
    errorMessage.value = errorText(
      openChallengeErrorMessage(err, t('Failed to join the room.', 'Không thể vào phòng.')),
    )
  } finally {
    acceptPending.value = false
  }
}

function onTurnstileVerified(token: string) {
  turnstileModalOpen.value = false
  socketStore.startMatchmaking('casual', token)
  void router.push('/')
}
</script>

<template>
  <AppLayout title="Join Match" fantasy>
    <div class="flex items-center justify-center min-h-[50vh]">
      <div v-if="status === 'accepting' || status === 'connecting'" class="text-center space-y-4">
        <BaseSpinner size="lg" class="mx-auto" />
        <h2 class="text-card text-foreground">
          {{ status === 'accepting' ? t('Joining room...', 'Đang vào phòng...') : t('Connecting to match...', 'Đang kết nối trận đấu...') }}
        </h2>
      </div>

      <div v-else-if="status === 'error'" class="w-full max-w-md">
        <ErrorState :message="errorMessage ?? t('Failed to join match.', 'Không thể tham gia trận.')">
          <template #action>
            <BaseButton variant="secondary" @click="router.push('/')">{{ t('Back to Lobby', 'Về sảnh') }}</BaseButton>
          </template>
        </ErrorState>
      </div>
    </div>
    <TurnstileModal
      v-if="turnstileModalOpen"
      @verify="onTurnstileVerified"
      @close="turnstileModalOpen = false; router.push('/')"
    />
  </AppLayout>
</template>
