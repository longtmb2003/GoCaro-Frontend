<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Send, ChevronDown, Lock } from 'lucide-vue-next'
import BaseDrawer from './ui/BaseDrawer.vue'
import BaseButton from './ui/BaseButton.vue'
import BaseAvatar from './ui/BaseAvatar.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseBadge from './ui/BaseBadge.vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { sendLobbyMessage, sendDirectMessage, getDirectMessageHistory, type LobbyMessage } from '@/api/chat'
import { ApiError } from '@/api/ApiError'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upgrade'): void
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()
const socialStore = useSocialStore()
const { addToast } = useToast()

const scrollContainer = ref<HTMLElement | null>(null)
const inputMessage = ref('')
const isSending = ref(false)
const chatInputRef = ref<InstanceType<typeof BaseInput> | null>(null)
const showNewMsgPill = ref(false)
const isLoadingMore = ref(false)

// Tabs: 'lobby' | 'dm_list' | 'dm_chat'
const currentTab = computed(() => {
  if (chatStore.activeChatId === 'lobby') return 'lobby'
  if (chatStore.activeChatId) return 'dm_chat'
  return 'dm_list'
})

// Auto-scroll logic
const scrollToBottom = (force = false) => {
  if (!scrollContainer.value) return
  
  const el = scrollContainer.value
  const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100

  if (force || isNearBottom) {
    nextTick(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({
        top: el.scrollHeight,
        behavior: prefersReduced ? 'auto' : 'smooth'
      })
      showNewMsgPill.value = false
    })
  } else {
    showNewMsgPill.value = true
  }
}

const handleScroll = async () => {
  if (!scrollContainer.value) return
  const el = scrollContainer.value

  // Hide pill if scrolled to bottom
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
    showNewMsgPill.value = false
  }

  // Load older messages if scrolled to top
  if (el.scrollTop < 20 && currentTab.value === 'dm_chat' && chatStore.activeChatId && !isLoadingMore.value) {
    const friendId = chatStore.activeChatId
    const msgs = chatStore.directMessages[friendId]
    if (msgs && msgs.length >= 50) {
      isLoadingMore.value = true
      try {
        const oldestMsg = msgs[0]
        if (oldestMsg) {
          const oldScrollHeight = el.scrollHeight
          const oldScrollTop = el.scrollTop
          const older = await getDirectMessageHistory(friendId, 50, oldestMsg.created_at)
          if (older.length > 0) {
            // Prepend older messages
            chatStore.directMessages[friendId] = [...older.reverse(), ...msgs]
            // Maintain scroll position
            nextTick(() => {
              el.scrollTop = el.scrollHeight - oldScrollHeight + oldScrollTop
            })
          }
        }
      } catch (e) {
        console.error('Load more failed', e)
      } finally {
        isLoadingMore.value = false
      }
    }
  }
}

watch(() => chatStore.lobbyMessages.length, () => {
  if (currentTab.value === 'lobby') scrollToBottom()
})

watch(() => currentTab.value, () => {
  scrollToBottom(true)
  nextTick(() => {
    chatInputRef.value?.focus()
  })
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      chatInputRef.value?.focus()
    })
  }
})

const activeFriend = computed(() => {
  if (currentTab.value !== 'dm_chat' || !chatStore.activeChatId) return null
  return socialStore.friends.find(f => f.user.id === chatStore.activeChatId)?.user
})

const messagesToDisplay = computed(() => {
  if (currentTab.value === 'lobby') {
    return chatStore.lobbyMessages
  } else if (currentTab.value === 'dm_chat' && chatStore.activeChatId) {
    return chatStore.directMessages[chatStore.activeChatId] || []
  }
  return []
})

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isSending.value) return
  
  isSending.value = true
  const text = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    if (currentTab.value === 'lobby') {
      const msg = await sendLobbyMessage(text)
      chatStore.handleEvent({ type: 'chat_lobby_receive', payload: msg })
    } else if (currentTab.value === 'dm_chat' && chatStore.activeChatId) {
      const msg = await sendDirectMessage(chatStore.activeChatId, text)
      chatStore.handleEvent({ type: 'chat_direct_receive', payload: msg })
    }
    scrollToBottom(true)
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        addToast('Bạn đang chat quá nhanh, vui lòng chờ một lát.', 'info')
      } else {
        addToast(error.message, 'error')
      }
    }
    // Restore text on failure
    inputMessage.value = text
  } finally {
    isSending.value = false
  }
}

// Map unread counts to friends
const friendsWithUnread = computed(() => {
  return socialStore.friends.map(f => ({
    ...f,
    unread: chatStore.unreadCounts[f.user.id] || 0
  })).sort((a, b) => b.unread - a.unread)
})
</script>

<template>
  <BaseDrawer
    v-if="open"
    title="Chat"
    @close="emit('close')"
  >
    <!-- Tabs Header -->
    <div class="flex gap-2 mb-2 pb-2 border-b border-border-strong">
      <button 
        class="px-3 py-1 text-sm font-medium rounded-sm transition-colors"
        :class="currentTab === 'lobby' ? 'bg-surface-sunken text-foreground' : 'text-foreground-muted hover:text-foreground'"
        @click="chatStore.setActiveChat('lobby')"
      >
        Lobby
      </button>
      <button 
        class="px-3 py-1 text-sm font-medium rounded-sm transition-colors flex items-center gap-1"
        :class="currentTab !== 'lobby' ? 'bg-surface-sunken text-foreground' : 'text-foreground-muted hover:text-foreground'"
        @click="chatStore.setActiveChat(null)"
      >
        Friends
        <span v-if="Object.values(chatStore.unreadCounts).reduce((a, b) => a + b, 0) > 0" class="flex h-2 w-2 rounded-full bg-error"></span>
      </button>
    </div>

    <!-- Content: DM List -->
    <div v-if="currentTab === 'dm_list'" class="flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar">
      <div v-if="friendsWithUnread.length === 0" class="text-center text-foreground-muted py-8 text-sm">
        You have no friends yet.
      </div>
      <button
        v-for="friend in friendsWithUnread"
        :key="friend.user.id"
        class="flex items-center gap-3 p-2 rounded-sm hover:bg-glass-light transition text-left"
        @click="chatStore.setActiveChat(friend.user.id)"
      >
        <BaseAvatar :name="friend.user.display_name" size="sm" :online="friend.is_online" />
        <span class="flex-1 text-sm font-medium text-foreground">{{ friend.user.display_name }}</span>
        <BaseBadge v-if="friend.unread > 0" variant="danger">{{ friend.unread }}</BaseBadge>
      </button>
    </div>

    <!-- Content: Chat Area (Lobby or DM) -->
    <template v-else>
      <div v-if="currentTab === 'dm_chat' && activeFriend" class="flex items-center gap-2 mb-2 pb-2 border-b border-border-subtle">
        <button class="text-foreground-muted hover:text-foreground mr-1" @click="chatStore.setActiveChat(null)">←</button>
        <BaseAvatar :name="activeFriend.display_name" size="sm" />
        <span class="text-sm font-semibold">{{ activeFriend.display_name }}</span>
      </div>

      <div 
        ref="scrollContainer" 
        class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 py-2 relative min-h-0"
        @scroll="handleScroll"
      >
        <div v-if="isLoadingMore" class="text-center text-xs text-foreground-muted py-1">Loading older messages...</div>

        <div 
          v-for="msg in messagesToDisplay" 
          :key="msg.id" 
          class="flex flex-col max-w-[85%]"
          :class="msg.sender_id === authStore.user?.id ? 'self-end items-end' : 'self-start items-start'"
        >
          <div class="text-[10px] text-foreground-muted mb-0.5 flex gap-1 mx-1">
            <span v-if="currentTab === 'lobby' && msg.sender_id !== authStore.user?.id" class="font-bold">{{ (msg as LobbyMessage).display_name }}</span>
            <span>{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
          <div 
            class="px-3 py-1.5 rounded-card text-sm text-foreground break-words"
            :class="msg.sender_id === authStore.user?.id ? 'bg-primary/20 border border-primary/30' : 'bg-surface-sunken border border-border-strong'"
          >
            {{ msg.content }}
          </div>
        </div>
        
        <div v-if="messagesToDisplay.length === 0" class="text-center text-foreground-muted text-sm my-auto">
          No messages yet.
        </div>
      </div>

      <!-- New Message Pill -->
      <button 
        v-if="showNewMsgPill"
        class="absolute bottom-16 left-1/2 -translate-x-1/2 bg-surface-3 border border-border-strong shadow-floating text-xs px-3 py-1 rounded-pill flex items-center gap-1 z-10 animate-fade-in"
        @click="scrollToBottom(true)"
      >
        New messages <ChevronDown :size="12" />
      </button>

      <!-- Input Area -->
      <div class="mt-3 pt-3 border-t border-border-strong">
        <div v-if="authStore.isGuest" class="flex flex-col items-center justify-center p-3 bg-surface-sunken rounded-sm border border-border-subtle gap-2">
          <div class="flex items-center gap-2 text-warning text-sm">
            <Lock :size="14" />
            <span>Guests cannot chat</span>
          </div>
          <BaseButton size="sm" variant="primary" @click="emit('upgrade')">Upgrade Account</BaseButton>
        </div>
        <form v-else class="flex gap-2" @submit.prevent="sendMessage">
          <BaseInput
            ref="chatInputRef"
            v-model="inputMessage"
            name="chat_message"
            label="Message"
            :label-hidden="true"
            placeholder="Type a message..."
            class="flex-1"
            :disabled="isSending"
            :maxlength="200"
          />
          <BaseButton 
            type="submit" 
            variant="primary" 
            size="lg"
            :disabled="!inputMessage.trim() || isSending"
            class="w-12 px-0 flex justify-center items-center shrink-0"
          >
            <Send :size="18" />
          </BaseButton>
        </form>
      </div>
    </template>
  </BaseDrawer>
</template>
