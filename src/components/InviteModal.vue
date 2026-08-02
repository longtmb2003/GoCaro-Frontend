<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Copy, Share } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useToast } from '@/composables/useToast'
import { useCountdown } from '@/composables/useCountdown'

const props = defineProps<{
  code: string
}>()

const emit = defineEmits<{ cancel: [] }>()

const { addToast } = useToast()

const shareUrl = ref('')
const expiresAt = ref(new Date(Date.now() + 15 * 60 * 1000).toISOString()) // 15 mins local estimate
const { secondsLeft } = useCountdown(expiresAt, () => {
  emit('cancel')
  addToast('Invite link expired.', 'error')
})

onMounted(() => {
  shareUrl.value = `${window.location.origin}/join/${props.code}`
})

async function copyCode() {
  await navigator.clipboard.writeText(props.code)
  addToast('Code copied to clipboard!', 'success')
}

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
  addToast('Link copied to clipboard!', 'success')
}

async function shareLink() {
  const nativeShare = (navigator.share as ((data: ShareData) => Promise<void>) | undefined)?.bind(navigator)
  if (nativeShare) {
    try {
      await nativeShare({
        title: 'GoCaro - Join my room',
        text: `Join my Gomoku match! Code: ${props.code}`,
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

      <h2 id="invite-modal-title" class="text-card text-foreground">Waiting for opponent...</h2>
      <p class="text-foreground-muted text-body mt-2">
        Share this code or link with a friend to play.
      </p>

      <div class="mt-6 bg-surface-sunken border border-border-subtle rounded-card p-4 flex flex-col items-center gap-3">
        <span class="text-2xl font-mono tracking-widest font-bold text-accent">{{ code }}</span>
        
        <div class="flex gap-2 w-full">
          <BaseButton variant="secondary" class="flex-1 text-sm" @click="copyCode">
            <Copy :size="16" class="mr-2 inline" aria-hidden="true" /> Code
          </BaseButton>
          <BaseButton variant="primary" class="flex-1 text-sm" @click="shareLink">
            <Share :size="16" class="mr-2 inline" aria-hidden="true" /> Share
          </BaseButton>
        </div>
      </div>

      <p class="text-foreground-muted text-caption mt-4" role="timer">
        Expires in {{ Math.floor(secondsLeft / 60) }}:{{ (secondsLeft % 60).toString().padStart(2, '0') }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-center">
        <BaseButton variant="secondary" class="w-full" @click="emit('cancel')">
          Cancel Match
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
