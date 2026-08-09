<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Copy, Share } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useToast } from '@/composables/useToast'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  code: string
}>()

const emit = defineEmits<{ cancel: [] }>()

const { addToast } = useToast()
const { t } = useAppLanguage()

const shareUrl = ref('')
const expiresAt = ref(new Date(Date.now() + 15 * 60 * 1000).toISOString()) // 15 mins local estimate
const { secondsLeft } = useCountdown(expiresAt, () => {
  emit('cancel')
  addToast(t('Invite link expired.', 'Liên kết mời đã hết hạn.'), 'error')
})

onMounted(() => {
  shareUrl.value = `${window.location.origin}/join/${props.code}`
})

async function copyCode() {
  await navigator.clipboard.writeText(props.code)
  addToast(t('Code copied to clipboard!', 'Đã sao chép mã!'), 'success')
}

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
  addToast(t('Link copied to clipboard!', 'Đã sao chép liên kết!'), 'success')
}

async function shareLink() {
  const nativeShare = (navigator.share as ((data: ShareData) => Promise<void>) | undefined)?.bind(navigator)
  if (nativeShare) {
    try {
      await nativeShare({
        title: t('GoCaro - Join my room', 'GoCaro - Tham gia phòng của tôi'),
        text: t(`Join my Gomoku match! Code: ${props.code}`, `Tham gia trận Caro của tôi! Mã: ${props.code}`),
        url: shareUrl.value,
      })
    } catch {
      // dismissed
    }
  } else {
    await copyLink()
  }
}
</script>

<template>
  <BaseModal aria-labelledby="invite-modal-title" @close="emit('cancel')">
    <div class="text-center">
      <div class="mb-4 flex justify-center">
        <BaseSpinner size="lg" />
      </div>

      <h2 id="invite-modal-title" class="text-card text-foreground">{{ t('Waiting for opponent...', 'Đang chờ đối thủ...') }}</h2>
      <p class="text-foreground-muted text-body mt-2">
        {{ t('Share this code or link with a friend to play.', 'Chia sẻ mã hoặc liên kết này để mời bạn bè cùng chơi.') }}
      </p>

      <div class="mt-6 bg-surface-sunken border border-border-subtle rounded-card p-4 flex flex-col items-center gap-3">
        <span class="text-2xl font-mono tracking-widest font-bold text-accent">{{ code }}</span>
        
        <div class="flex gap-2 w-full">
          <BaseButton variant="secondary" class="flex-1 text-sm" @click="copyCode">
            <FantasySystemIcon compact class="mr-2 inline-grid">
              <Copy :size="16" aria-hidden="true" />
            </FantasySystemIcon>
            {{ t('Code', 'Mã') }}
          </BaseButton>
          <BaseButton variant="primary" class="flex-1 text-sm" @click="shareLink">
            <FantasySystemIcon compact class="mr-2 inline-grid">
              <Share :size="16" aria-hidden="true" />
            </FantasySystemIcon>
            {{ t('Share', 'Chia sẻ') }}
          </BaseButton>
        </div>
      </div>

      <p class="text-foreground-muted text-caption mt-4" role="timer">
        {{ t('Expires in', 'Hết hạn sau') }} {{ Math.floor(secondsLeft / 60) }}:{{ (secondsLeft % 60).toString().padStart(2, '0') }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-center">
        <BaseButton variant="secondary" class="w-full" @click="emit('cancel')">
          {{ t('Cancel Match', 'Hủy trận') }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
