<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Send, ArrowLeft, ChevronDown, Lock } from 'lucide-vue-next'
import BaseDrawer from './ui/BaseDrawer.vue'
import BaseButton from './ui/BaseButton.vue'
import BaseAvatar from './ui/BaseAvatar.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseBadge from './ui/BaseBadge.vue'
import FantasySystemIcon from './ui/FantasySystemIcon.vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { sendLobbyMessage, sendDirectMessage, getDirectMessageHistory, type LobbyMessage } from '@/api/chat'
import { ApiError } from '@/api/ApiError'
import { useToast } from '@/composables/useToast'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'upgrade'): void
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()
const socialStore = useSocialStore()
const { addToast } = useToast()
const { t } = useAppLanguage()

const scrollContainer = ref<HTMLElement | null>(null)
const inputMessage = ref('')
const isSending = ref(false)
const chatInputRef = ref<{ focus: () => void } | null>(null)
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
    void nextTick(() => {
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
            void nextTick(() => {
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
  void nextTick(() => {
    chatInputRef.value?.focus()
  })
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    void nextTick(() => {
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
    await nextTick()
    if (props.open) {
      chatInputRef.value?.focus()
    }
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
    :title="t('Chat', 'Trò chuyện')"
    @close="emit('close')"
  >
    <!-- Tabs Header -->
    <div class="flex gap-1.5 mb-2 pb-2 border-b border-[var(--color-fantasy-border-subtle)]">
      <button 
        class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all border"
        :class="currentTab === 'lobby' ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'"
        @click="chatStore.setActiveChat('lobby')"
      >
        {{ t('Lobby', 'Sảnh') }}
      </button>
      <button 
        class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5"
        :class="currentTab !== 'lobby' ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'"
        @click="chatStore.setActiveChat(null)"
      >
        {{ t('Friends', 'Bạn bè') }}
        <span v-if="chatStore.totalUnreadMessages > 0" class="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
      </button>
    </div>

    <!-- Content: DM List -->
    <div v-if="currentTab === 'dm_list'" class="flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar">
      <div v-if="friendsWithUnread.length === 0" class="text-center text-slate-400 py-8 text-sm">
        {{ t('You have no friends yet.', 'Bạn chưa có người bạn nào.') }}
      </div>
      <button
        v-for="friend in friendsWithUnread"
        :key="friend.user.id"
        class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-[var(--color-fantasy-border-subtle)] transition text-left"
        @click="chatStore.setActiveChat(friend.user.id)"
      >
        <BaseAvatar :name="friend.user.display_name" size="sm" :online="friend.is_online" />
        <span class="flex-1 text-sm font-semibold text-slate-200">{{ friend.user.display_name }}</span>
        <BaseBadge v-if="friend.unread > 0" variant="danger">{{ friend.unread }}</BaseBadge>
      </button>
    </div>

    <!-- Content: Chat Area (Lobby or DM) -->
    <template v-else>
      <div v-if="currentTab === 'dm_chat' && activeFriend" class="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--color-fantasy-border-subtle)]">
        <button class="text-slate-400 hover:text-white mr-1 p-1 rounded-lg hover:bg-white/10 transition" :title="t('Back', 'Quay lại')" @click="chatStore.setActiveChat(null)">
          <FantasySystemIcon compact><ArrowLeft :size="16" /></FantasySystemIcon>
        </button>
        <BaseAvatar :name="activeFriend.display_name" size="sm" />
        <span class="text-sm font-bold text-[var(--color-fantasy-stone)]">{{ activeFriend.display_name }}</span>
      </div>

      <div 
        ref="scrollContainer" 
        class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 py-2 relative min-h-0"
        @scroll="handleScroll"
      >
        <div v-if="isLoadingMore" class="text-center text-xs text-slate-400 py-1">{{ t('Loading older messages...', 'Đang tải tin nhắn cũ...') }}</div>

        <div 
          v-for="msg in messagesToDisplay" 
          :key="msg.id" 
          class="flex flex-col max-w-[85%]"
          :class="msg.sender_id === authStore.user?.id ? 'self-end items-end' : 'self-start items-start'"
        >
          <div class="text-[10px] text-slate-400 mb-0.5 flex gap-1 mx-1">
            <span v-if="currentTab === 'lobby' && msg.sender_id !== authStore.user?.id" class="font-bold text-amber-300/90">{{ (msg as LobbyMessage).display_name }}</span>
            <span>{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
          <div 
            class="px-3 py-1.5 rounded-xl text-sm break-words shadow-sm"
            :class="msg.sender_id === authStore.user?.id ? 'bg-amber-400/15 border border-amber-400/30 text-amber-100' : 'bg-slate-900/80 border border-slate-800 text-slate-200'"
          >
            {{ msg.content }}
          </div>
        </div>
        
        <div v-if="messagesToDisplay.length === 0" class="text-center text-foreground-muted text-sm my-auto">
          {{ t('No messages yet.', 'Chưa có tin nhắn.') }}
        </div>
      </div>

      <!-- New Message Pill -->
      <button 
        v-if="showNewMsgPill"
        class="absolute bottom-16 left-1/2 -translate-x-1/2 bg-surface-3 border border-border-strong shadow-floating text-xs px-3 py-1 rounded-pill flex items-center gap-1 z-10 animate-fade-in"
        @click="scrollToBottom(true)"
      >
        {{ t('New messages', 'Tin nhắn mới') }}
        <FantasySystemIcon compact><ChevronDown :size="12" /></FantasySystemIcon>
      </button>

      <!-- Input Area -->
      <div class="mt-3 pt-3 border-t border-border-strong">
        <div v-if="authStore.isGuest" class="flex flex-col items-center justify-center p-3 bg-surface-sunken rounded-sm border border-border-subtle gap-2">
          <div class="flex items-center gap-2 text-warning text-sm">
            <FantasySystemIcon compact><Lock :size="14" /></FantasySystemIcon>
            <span>{{ t('Guests cannot chat', 'Khách không thể trò chuyện') }}</span>
          </div>
          <BaseButton size="sm" variant="primary" @click="emit('upgrade')">{{ t('Upgrade Account', 'Nâng cấp tài khoản') }}</BaseButton>
        </div>
        <form v-else class="flex gap-2" @submit.prevent="sendMessage">
          <BaseInput
            ref="chatInputRef"
            v-model="inputMessage"
            name="chat_message"
            :label="t('Message', 'Tin nhắn')"
            :label-hidden="true"
            :placeholder="t('Type a message...', 'Nhập tin nhắn...')"
            class="flex-1"
            :disabled="isSending"
            :maxlength="200"
          />
          <BaseButton 
            type="submit" 
            variant="primary" 
            class="w-12 h-11 px-0 flex justify-center items-center shrink-0 rounded-button"
            :disabled="!inputMessage.trim() || isSending"
          >
            <FantasySystemIcon compact><Send :size="18" /></FantasySystemIcon>
          </BaseButton>
        </form>
      </div>
    </template>
  </BaseDrawer>
</template>
