import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'
import type { SocketMessage } from '@/api/websocket'
import {
  type DirectMessage,
  type LobbyMessage,
  getLobbyMessages,
  getDirectMessageHistory,
  getUnreadCounts,
  markAsRead
} from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const lobbyMessages = ref<LobbyMessage[]>([])
  const directMessages = ref<Record<string, DirectMessage[]>>({})
  const unreadCounts = ref<Record<string, number>>({})
  const activeChatId = ref<string | null>(null) // 'lobby' or friend's UUID

  const markReadTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

  const fetchInitialData = async () => {
    if (authStore.isGuest) {
      // Guests can read lobby
      try {
        lobbyMessages.value = await getLobbyMessages()
      } catch (e) {
        console.error('Failed to fetch lobby messages for guest', e)
      }
      return
    }

    try {
      const [lobby, unread] = await Promise.all([
        getLobbyMessages(),
        getUnreadCounts()
      ])
      lobbyMessages.value = lobby
      unreadCounts.value = unread
    } catch (e) {
      console.error('Failed to fetch chat data', e)
    }
  }

  const fetchFriendHistory = async (friendId: string) => {
    if (!directMessages.value[friendId]) {
      directMessages.value[friendId] = []
    }
    try {
      const history = await getDirectMessageHistory(friendId)
      // The backend returns messages in DESC order (newest first). 
      // We reverse them to display chronologically (bottom-up).
      directMessages.value[friendId] = history.reverse()
      
      // If this friend has unread, mark them as read since we just opened it
      if (unreadCounts.value[friendId] && unreadCounts.value[friendId] > 0) {
        await doMarkAsRead(friendId)
      }
    } catch (e) {
      console.error('Failed to fetch DM history', e)
    }
  }

  const doMarkAsRead = async (friendId: string) => {
    const msgs = directMessages.value[friendId]
    if (!msgs || msgs.length === 0) return

    // Find the latest message received from the friend
    let latestMsg: DirectMessage | null = null
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i]
      if (msg && msg.sender_id === friendId) {
        latestMsg = msg
        break
      }
    }

    if (latestMsg) {
      try {
        await markAsRead(friendId, latestMsg.created_at)
        unreadCounts.value[friendId] = 0
      } catch (e) {
        console.error('Failed to mark read', e)
      }
    }
  }

  const debouncedMarkAsRead = (friendId: string) => {
    const existing = markReadTimeouts.get(friendId)
    if (existing) clearTimeout(existing)
    const timeout = setTimeout(() => {
      void doMarkAsRead(friendId)
      markReadTimeouts.delete(friendId)
    }, 1000)
    markReadTimeouts.set(friendId, timeout)
  }

  const setActiveChat = (id: string | null) => {
    activeChatId.value = id
    if (id && id !== 'lobby') {
      if (!directMessages.value[id]) {
        void fetchFriendHistory(id)
      } else if (unreadCounts.value[id] && unreadCounts.value[id] > 0) {
        // We already have history but just reopened, clear unread
        void doMarkAsRead(id)
      }
    }
  }

  const handleEvent = (msg: SocketMessage) => {
    if (msg.type === 'chat_lobby_receive') {
      const payload = msg.payload as LobbyMessage
      const idx = lobbyMessages.value.findIndex(m => m.id === payload.id)
      if (idx === -1) {
        lobbyMessages.value.push(payload)
        if (lobbyMessages.value.length > 100) {
          lobbyMessages.value.shift() // keep max 100
        }
      }
    } 
    else if (msg.type === 'chat_direct_receive') {
      const payload = msg.payload as DirectMessage
      const myId = authStore.user?.id
      const isMine = payload.sender_id === myId
      const friendId = isMine ? payload.receiver_id : payload.sender_id

      if (!directMessages.value[friendId]) {
        directMessages.value[friendId] = []
      }

      const arr = directMessages.value[friendId]
      const idx = arr.findIndex(m => m.id === payload.id)
      if (idx === -1) {
        arr.push(payload)
      }

      // Handle badge and mark read
      if (!isMine) {
        if (activeChatId.value === friendId) {
          // Chat is open -> don't increment badge, instead mark as read
          debouncedMarkAsRead(friendId)
        } else {
          // Chat is not open -> increment badge
          unreadCounts.value[friendId] = (unreadCounts.value[friendId] || 0) + 1
        }
      }
    }
  }

  const totalUnreadMessages = computed(() => {
    return Object.values(unreadCounts.value).reduce((acc: number, count: number) => acc + count, 0)
  })

  const reset = () => {
    lobbyMessages.value = []
    directMessages.value = {}
    unreadCounts.value = {}
    activeChatId.value = null
  }

  return {
    lobbyMessages,
    directMessages,
    unreadCounts,
    activeChatId,
    totalUnreadMessages,
    fetchInitialData,
    fetchFriendHistory,
    setActiveChat,
    handleEvent,
    reset
  }
})
