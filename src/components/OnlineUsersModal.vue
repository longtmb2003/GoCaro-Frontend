<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { useLobbyStore } from '@/stores/lobby'

const emit = defineEmits<{ (e: 'close'): void }>()
const lobby = useLobbyStore()

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
  <BaseModal title="Online Users" size="md" @close="emit('close')">
    <div class="space-y-4">
      <div class="gap-3 flex flex-wrap items-center justify-between">
        <h3 class="text-body text-foreground font-semibold">
          Players Online: <span class="text-success">{{ lobby.onlineUsers.length }}</span>
        </h3>

        <div v-if="totalOnlinePages > 1" class="gap-2 flex items-center">
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="onlinePage === 0"
            @click="prevOnlinePage"
          >
            <span class="sr-only">Previous page</span>
            <FantasySystemIcon compact
              ><ChevronLeft :size="16" aria-hidden="true"
            /></FantasySystemIcon>
          </BaseButton>
          <span class="text-small text-foreground-muted tabular-nums">
            Page {{ onlinePage + 1 }} of {{ totalOnlinePages }}
          </span>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="onlinePage >= totalOnlinePages - 1"
            @click="nextOnlinePage"
          >
            <span class="sr-only">Next page</span>
            <FantasySystemIcon compact
              ><ChevronRight :size="16" aria-hidden="true"
            /></FantasySystemIcon>
          </BaseButton>
        </div>
      </div>

      <EmptyState
        v-if="lobby.onlineUsers.length === 0"
        title="No one else is online"
        description="Start a match and other players will show up here."
      />
      <ul v-else class="gap-3 grid grid-cols-2 sm:grid-cols-3">
        <GlassCard
          v-for="user in paginatedOnlineUsers"
          :key="user.id"
          as="li"
          variant="nested"
          class="gap-3 flex items-center"
        >
          <BaseAvatar :name="user.display_name" size="sm" online />
          <span class="text-body text-foreground truncate font-medium">{{ user.display_name }}</span>
        </GlassCard>
      </ul>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <BaseButton variant="secondary" @click="emit('close')">Close</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
