<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { useLobbyStore } from '@/stores/lobby'
import { useAppLanguage } from '@/composables/useAppLanguage'

const emit = defineEmits<{ (e: 'close'): void }>()
const lobby = useLobbyStore()
const { t } = useAppLanguage()

const onlinePage = ref(0)
const onlinePageSize = 20

const paginatedOnlineUsers = computed(() => {
  const start = onlinePage.value * onlinePageSize
  return lobby.onlineUsers.slice(start, start + onlinePageSize)
})

const totalOnlinePages = computed(() => Math.ceil(lobby.onlineUsers.length / onlinePageSize))

function nextOnlinePage() {
  if (onlinePage.value < totalOnlinePages.value - 1) onlinePage.value++
}

function prevOnlinePage() {
  if (onlinePage.value > 0) onlinePage.value--
}
</script>

<template>
  <BaseModal :title="t('Online Users', 'Người chơi trực tuyến')" size="md" @close="emit('close')">
    <div class="space-y-4">
      <div class="gap-3 flex flex-wrap items-center justify-between">
        <h3 class="text-body text-foreground font-semibold">
          {{ t('Players Online', 'Người chơi trực tuyến') }}: <span class="text-success">{{ lobby.onlineUsers.length }}</span>
        </h3>

        <div v-if="totalOnlinePages > 1" class="gap-2 flex items-center">
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="onlinePage === 0"
            @click="prevOnlinePage"
          >
            <span class="sr-only">{{ t('Previous page', 'Trang trước') }}</span>
            <FantasySystemIcon compact
              ><ChevronLeft :size="16" aria-hidden="true"
            /></FantasySystemIcon>
          </BaseButton>
          <span class="text-small text-foreground-muted tabular-nums">
            {{ t('Page', 'Trang') }} {{ onlinePage + 1 }} {{ t('of', 'trên') }} {{ totalOnlinePages }}
          </span>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="onlinePage >= totalOnlinePages - 1"
            @click="nextOnlinePage"
          >
            <span class="sr-only">{{ t('Next page', 'Trang sau') }}</span>
            <FantasySystemIcon compact
              ><ChevronRight :size="16" aria-hidden="true"
            /></FantasySystemIcon>
          </BaseButton>
        </div>
      </div>

      <EmptyState
        v-if="lobby.onlineUsers.length === 0"
        :title="t('No one else is online', 'Chưa có người chơi nào khác trực tuyến')"
        :description="t('Start a match and other players will show up here.', 'Bắt đầu một trận và người chơi khác sẽ xuất hiện tại đây.')"
      />
      <ul v-else class="gap-3 grid grid-cols-2 sm:grid-cols-3">
        <GlassCard
          v-for="user in paginatedOnlineUsers"
          :key="user.id"
          as="li"
          variant="nested"
          class="gap-3 flex items-center"
        >
          <BaseAvatar :name="user.display_name" size="sm" online :class="user.profile_frame" />
          <span class="text-body text-foreground truncate font-medium flex flex-col items-start">
            {{ user.display_name }}
            <span v-if="user.title" class="text-[0.6rem] leading-tight font-bold px-1.5 py-0.25 mt-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize whitespace-nowrap">{{ user.title.replace('title_', '').split('_').join(' ') }}</span>
          </span>
        </GlassCard>
      </ul>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <BaseButton variant="secondary" @click="emit('close')">{{ t('Close', 'Đóng') }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
