<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

defineProps<{
  secondsLeft: number
  state: 'reconnecting' | 'failed'
}>()

const emit = defineEmits<{ leave: []; retry: [] }>()
const { t } = useAppLanguage()
</script>

<template>
  <!-- Not dismissible: the match is still live, so leaving must be deliberate. -->
  <BaseModal :dismissible="false" aria-labelledby="reconnecting-heading">
    <div class="text-center">
      <div v-if="state === 'reconnecting'" class="mb-4 flex justify-center">
        <BaseSpinner size="md" />
      </div>

      <h2 id="reconnecting-heading" class="text-card text-foreground">
        {{ state === 'reconnecting' ? t('Reconnecting…', 'Đang kết nối lại…') : t('Connection lost', 'Mất kết nối') }}
      </h2>
      <p
        v-if="state === 'reconnecting'"
        class="text-foreground-muted text-body mt-2"
        aria-live="polite"
      >
        {{ t('Your match is still going. Trying to rejoin —', 'Trận đấu vẫn đang tiếp tục. Đang thử tham gia lại —') }}
        <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span> {{ t('remaining.', 'còn lại.') }}
      </p>
      <p v-else class="text-foreground-muted text-body mt-2" role="alert">
        {{ t('The automatic reconnect did not succeed. You can try connecting again or leave the match.', 'Tự động kết nối lại không thành công. Bạn có thể thử kết nối lại hoặc rời trận.') }}
      </p>
    </div>

    <template #footer>
      <BaseButton v-if="state === 'failed'" class="w-full" @click="emit('retry')">
        {{ t('Try reconnecting', 'Thử kết nối lại') }}
      </BaseButton>
      <BaseButton variant="secondary" class="w-full" @click="emit('leave')">
        {{ t('Leave match', 'Rời trận') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
