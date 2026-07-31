import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SocialSocketManager, socialUrl } from '@/api/socialSocket'
import type { SocketMessage } from '@/api/websocket'
import { getFriends, getIncomingRequests, type Friend, type FriendRequest } from '@/api/friend'
import { useToast } from '@/composables/useToast'
import { useChatStore } from './chat'

export const useSocialStore = defineStore('social', () => {
  const isConnected = ref(false)
  const friends = ref<Friend[]>([])
  const incomingRequests = ref<FriendRequest[]>([])
  
  let manager: SocialSocketManager | null = null

  const toast = useToast()

  const connect = (token: string) => {
    disconnect()
    
    manager = new SocialSocketManager(token)
    manager.connect(socialUrl(), {
      onOpen: () => {
        isConnected.value = true
        fetchInitialData()
        
        // Also init chat state
        const chatStore = useChatStore()
        chatStore.fetchInitialData()
      },
      onMessage: handleMessage,
      onClose: () => {
        isConnected.value = false
      }
    })
  }

  const disconnect = () => {
    if (manager) {
      manager.close()
      manager = null
    }
    isConnected.value = false
    friends.value = []
    incomingRequests.value = []
    useChatStore().reset()
  }

  const fetchInitialData = async () => {
    try {
      const [fData, rData] = await Promise.all([
        getFriends(),
        getIncomingRequests()
      ])
      friends.value = fData
      incomingRequests.value = rData
    } catch (e) {
      console.error('Failed to fetch social data', e)
    }
  }

  const handleMessage = (msg: SocketMessage) => {
    const chatStore = useChatStore()
    
    // Wire up Chat events
    if (msg.type === 'chat_lobby_receive' || msg.type === 'chat_direct_receive') {
      chatStore.handleEvent(msg)
      return
    }

    // Social events
    switch (msg.type) {
      case 'friend_online': {
        const payload = msg.payload as { user_id: string }
        const f = friends.value.find(f => f.user.id === payload.user_id)
        if (f) f.is_online = true
        break
      }
      case 'friend_offline': {
        const payload = msg.payload as { user_id: string }
        const f = friends.value.find(f => f.user.id === payload.user_id)
        if (f) f.is_online = false
        break
      }
      case 'friend_request_received': {
        fetchInitialData()
        toast.addToast('Bạn có một lời mời kết bạn mới', 'info')
        break
      }
      case 'friend_request_accepted': {
        fetchInitialData()
        toast.addToast('Một lời mời kết bạn đã được chấp nhận', 'success')
        break
      }
      case 'challenge_received': {
        // toast.addToast(`Bạn nhận được lời thách đấu`, 'info')
        // In a real flow, a modal should pop up, this will be handled via a global state if necessary
        // or just by listening to this store.
        break
      }
      case 'challenge_accepted': {
        // toast.addToast('Thách đấu đã được chấp nhận, đang vào trận...', 'success')
        break
      }
      case 'challenge_declined': {
        // toast.addToast('Lời thách đấu của bạn bị từ chối', 'error')
        break
      }
      case 'challenge_expired': {
        // toast.addToast('Lời thách đấu đã hết hạn', 'info')
        break
      }
    }
  }

  return {
    isConnected,
    friends,
    incomingRequests,
    connect,
    disconnect,
    fetchInitialData
  }
})
