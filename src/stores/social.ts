import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SocialSocketManager, socialUrl } from '@/api/socialSocket'
import type { SocketMessage } from '@/api/websocket'
import { getFriends, getIncomingRequests, type Friend, type FriendRequest } from '@/api/friend'

export const useSocialStore = defineStore('social', () => {
  const isConnected = ref(false)
  const friends = ref<Friend[]>([])
  const incomingRequests = ref<FriendRequest[]>([])
  
  let manager: SocialSocketManager | null = null

  const connect = (token: string) => {
    disconnect()
    
    manager = new SocialSocketManager(token)
    manager.connect(socialUrl(), {
      onOpen: () => {
        isConnected.value = true
        fetchInitialData()
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
    switch (msg.type) {
      case 'friend_online': {
        const id = msg.user_id as string
        const f = friends.value.find(f => f.user.id === id)
        if (f) f.is_online = true
        break
      }
      case 'friend_offline': {
        const id = msg.user_id as string
        const f = friends.value.find(f => f.user.id === id)
        if (f) f.is_online = false
        break
      }
      case 'friend_request_received': {
        fetchInitialData() // Simplest is to refetch
        break
      }
      case 'challenge_received': {
        // Handle challenge notification
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
