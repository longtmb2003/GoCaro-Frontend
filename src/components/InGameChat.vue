<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { Volume2, VolumeX, MessageSquareOff } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'

const auth = useAuthStore()
const socket = useSocketStore()
const { addToast } = useToast()

const content = ref('')
const scrollArea = ref<HTMLElement | null>(null)

// Read straight off the store: a setup store hands out the unwrapped value, so
// copying it here would take a snapshot of the boolean instead of the ref.
const isMuted = computed(() => socket.isMuted)

function scrollToBottom() {
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
}

watch(
  () => socket.chatHistory,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true },
)

onMounted(() => {
  scrollToBottom()
})

function send() {
  const msg = content.value.trim()
  if (!msg) return
  if (msg.length > 500) {
    addToast('Message too long (max 500 characters)', 'error')
    return
  }
  socket.sendGameChat(msg)
  content.value = ''
  
  // We don't push optimistically here, wait for broadcast from server
}

function toggleMute() {
  socket.isMuted = !socket.isMuted
}
</script>

<template>
  <GlassCard as="div" class="flex flex-col flex-1 min-h-[250px] overflow-hidden border border-accent/20 bg-accent/5 shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.1)] relative">
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-accent/20 shrink-0">
      <h3 class="text-caption font-black tracking-widest uppercase text-accent drop-shadow-sm flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span> Chat
      </h3>
      <button 
        class="text-foreground-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full p-1"
        :title="isMuted ? 'Unmute opponent' : 'Mute opponent'"
        @click="toggleMute"
      >
        <VolumeX v-if="isMuted" :size="16" />
        <Volume2 v-else :size="16" />
      </button>
    </div>

    <!-- Scrollable Messages Area -->
    <div 
      ref="scrollArea" 
      class="flex-1 overflow-y-auto space-y-3 min-h-[100px] pr-2 custom-scrollbar"
    >
      <div v-if="isMuted" class="flex flex-col items-center justify-center h-full text-foreground-muted gap-2 opacity-50">
        <MessageSquareOff :size="24" />
        <p class="text-small font-medium text-center">Chat muted</p>
      </div>
      <div v-else-if="socket.chatHistory.length === 0" class="flex items-center justify-center h-full text-foreground-muted">
        <p class="text-small font-medium opacity-50 text-center">Say hello to your opponent!</p>
      </div>

      <template v-else>
        <div
          v-for="(msg, index) in socket.chatHistory"
          :key="index"
          class="flex flex-col"
          :class="[msg.sender_id === auth.user?.id ? 'items-end' : 'items-start']"
        >
          <div
            class="px-3 py-2 rounded-2xl max-w-[85%] break-words"
            :class="[
              msg.sender_id === auth.user?.id
                ? 'bg-accent text-slate-950 font-medium rounded-br-sm shadow-glow'
                : 'bg-zinc-800 text-foreground rounded-bl-sm',
            ]"
          >
            <p class="text-body">{{ msg.content }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Input Area -->
    <form class="mt-3 shrink-0 flex items-center gap-2" @submit.prevent="send">
      <input
        v-model="content"
        type="text"
        placeholder="Type a message..."
        autocomplete="off"
        maxlength="500"
        class="flex-1 bg-surface-sunken border border-border-strong rounded-xl px-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all h-14"
        :disabled="isMuted"
        aria-label="Message"
      />
      <BaseButton 
        type="submit" 
        variant="primary" 
        class="w-14 !h-14 px-0 flex justify-center items-center shrink-0 transition-all duration-300 group rounded-xl" 
        :class="content.trim() && !isMuted ? 'shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.5)] scale-105' : 'opacity-80'"
        :disabled="!content.trim() || isMuted" 
        aria-label="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform" :class="content.trim() && !isMuted ? 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5' : ''"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>
      </BaseButton>
    </form>
  </GlassCard>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
