import { defineStore } from 'pinia'
import { ref } from 'vue'

import { WsManager } from '@/api/WsManager'
import { useAuthStore } from '@/stores/auth'
import type { LobbyStatePayload, LobbyUser } from '@/types/game'

/** Health of the lobby feed, so the UI can report it instead of assuming it. */
export type LobbyConnectionState = 'connecting' | 'online' | 'offline'

export const useLobbyStore = defineStore('lobby', () => {
  const auth = useAuthStore()
  const onlineUsers = ref<LobbyUser[]>([])
  const connectionState = ref<LobbyConnectionState>('offline')

  const manager = new WsManager({
    url: '/ws/lobby',
    autoReconnect: true,
    onMessage(message) {
      if (message.type === 'lobby_state') {
        onlineUsers.value = (message.payload as LobbyStatePayload).online_users
      }
    },
    onOpen() {
      connectionState.value = 'online'
    },
    onClose() {
      // Auto-reconnect will re-open and flip this back; until then the feed
      // really is down, so say so.
      connectionState.value = 'offline'
    },
  })

  function connect(): void {
    if (auth.isAuthenticated) {
      connectionState.value = 'connecting'
      manager.connect(auth.token)
    }
  }

  function disconnect(): void {
    manager.close()
    // A manual close detaches the socket's onclose, so reset it here.
    connectionState.value = 'offline'
    onlineUsers.value = []
  }

  return {
    onlineUsers,
    connectionState,
    connect,
    disconnect,
  }
})
