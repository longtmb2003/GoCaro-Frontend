<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import BaseButton from './BaseButton.vue'
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

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('button')?.focus()
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="online-users-heading"
    @keydown="onKeydown"
  >
    <div class="bg-surface-elevated w-full max-w-lg rounded-lg p-6 shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h2 id="online-users-heading" class="text-foreground text-lg font-semibold">
          Online Users
        </h2>
        <button class="text-foreground-muted hover:text-foreground" @click="emit('close')">✕</button>
      </div>
      <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-foreground">
          Players Online: <span class="text-success-500">{{ lobby.onlineUsers.length }}</span>
        </h3>
        
        <div v-if="totalOnlinePages > 1" class="flex items-center gap-2">
          <button :disabled="onlinePage === 0" class="p-1 rounded bg-surface hover:bg-surface-elevated disabled:opacity-30 transition-colors border border-border-subtle" @click="prevOnlinePage">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="text-xs text-foreground-muted">Page {{ onlinePage + 1 }} of {{ totalOnlinePages }}</span>
          <button :disabled="onlinePage >= totalOnlinePages - 1" class="p-1 rounded bg-surface hover:bg-surface-elevated disabled:opacity-30 transition-colors border border-border-subtle" @click="nextOnlinePage">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div class="min-h-[250px]">
        <div v-if="lobby.onlineUsers.length === 0" class="text-foreground-muted py-8 text-center text-sm">
          No one else is online right now.
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div v-for="user in paginatedOnlineUsers" :key="user.id" class="border border-border-subtle rounded-lg p-2.5 flex items-center gap-3 bg-surface hover:bg-surface-elevated shadow-sm transition-colors cursor-default">
            <div class="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {{ user.username.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium truncate text-foreground">{{ user.username }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <BaseButton variant="secondary" @click="emit('close')">Close</BaseButton>
      </div>
    </div>
  </div>
</div>
</template>
