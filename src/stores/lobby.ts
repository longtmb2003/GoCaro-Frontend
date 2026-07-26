import { defineStore } from 'pinia'
import { ref } from 'vue'

import { WsManager } from '@/api/WsManager'
import { useAuthStore } from '@/stores/auth'
import type { LobbyStatePayload, LobbyUser } from '@/types/game'

export const useLobbyStore = defineStore('lobby', () => {
  const auth = useAuthStore()
  const onlineUsers = ref<LobbyUser[]>([])

  const manager = new WsManager({
    url: '/ws/lobby',
    autoReconnect: true,
    onMessage(message) {
      if (message.type === 'lobby_state') {
        onlineUsers.value = (message.payload as LobbyStatePayload).online_users
      }
    },
  })

  function connect(): void {
    if (auth.isAuthenticated) {
      manager.connect(auth.token)
    }
  }

  function disconnect(): void {
    manager.close()
    onlineUsers.value = []
  }

  return {
    onlineUsers,
    connect,
    disconnect,
  }
})
