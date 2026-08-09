<script setup lang="ts">
import { computed } from 'vue'
import { Clock3, UserPlus, Users } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import BaseButton from '@/components/ui/BaseButton.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = withDefaults(
  defineProps<{
    userId: string
    displayName: string
    compact?: boolean
  }>(),
  { compact: false },
)

const auth = useAuthStore()
const social = useSocialStore()
const { t } = useAppLanguage()

const isSelf = computed(() => auth.user?.id === props.userId)
const isFriend = computed(() => social.friends.some((friend) => friend.user.id === props.userId))
const hasIncomingRequest = computed(() =>
  social.incomingRequests.some((request) => request.user.id === props.userId),
)
const requestPending = computed(() => social.friendRequestPendingIds.includes(props.userId))
const requestSent = computed(() => social.sentFriendRequestIds.includes(props.userId))
const disabled = computed(
  () => isFriend.value || hasIncomingRequest.value || requestSent.value || requestPending.value,
)
const label = computed(() => {
  if (isFriend.value) return t('Friends', 'Bạn bè')
  if (hasIncomingRequest.value) return t('Request received', 'Đã nhận lời mời')
  if (requestSent.value) return t('Request sent', 'Đã gửi lời mời')
  if (requestPending.value) return t('Sending request', 'Đang gửi lời mời')
  return t('Add friend', 'Kết bạn')
})

function sendRequest(): void {
  void social.requestFriendship(props.userId, props.displayName)
}
</script>

<template>
  <BaseButton
    v-if="!isSelf && !auth.isGuest"
    variant="secondary"
    size="sm"
    class="friend-request-button"
    :class="{ 'friend-request-button--compact': compact }"
    :disabled="disabled"
    :loading="requestPending"
    :title="label"
    :aria-label="`${label}: ${displayName}`"
    @click="sendRequest"
  >
    <FantasySystemIcon v-if="!requestPending" compact>
      <Users v-if="isFriend" :size="16" aria-hidden="true" />
      <Clock3 v-else-if="hasIncomingRequest || requestSent" :size="16" aria-hidden="true" />
      <UserPlus v-else :size="16" aria-hidden="true" />
    </FantasySystemIcon>
    <span class="friend-request-button__label">{{ label }}</span>
  </BaseButton>
</template>

<style scoped>
.friend-request-button {
  flex: 0 0 auto;
}

.friend-request-button--compact {
  width: 2.75rem;
  padding-inline: 0;
}

.friend-request-button--compact .friend-request-button__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
