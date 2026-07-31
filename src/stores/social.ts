import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SocialSocketManager, socialUrl } from '@/api/socialSocket'
import type { SocketMessage } from '@/api/websocket'
import {
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  getFriends,
  getIncomingRequests,
  sendChallenge,
  type Friend,
  type FriendRequest,
} from '@/api/friend'
import { useToast } from '@/composables/useToast'
import { useChatStore } from './chat'
import { useSocketStore } from './socket'

export interface IncomingChallenge {
  challenge_id: string
  sender_id: string
  sender_name: string
  expires_at: string
}

/** An invitation we sent and are still waiting on, so it can be shown and withdrawn. */
export interface OutgoingChallenge {
  challenge_id: string
  receiver_id: string
  receiver_name: string
  expires_at: string
}

export const useSocialStore = defineStore('social', () => {
  const isConnected = ref(false)
  const friends = ref<Friend[]>([])
  const incomingRequests = ref<FriendRequest[]>([])
  const incomingChallenge = ref<IncomingChallenge | null>(null)
  const outgoingChallenge = ref<OutgoingChallenge | null>(null)

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
    incomingChallenge.value = null
    outgoingChallenge.value = null
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
    const socketStore = useSocketStore()
    
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
        toast.addToast('You have a new friend request', 'info')
        break
      }
      case 'friend_request_accepted': {
        fetchInitialData()
        toast.addToast('A friend request was accepted', 'success')
        break
      }
      case 'challenge_received': {
        const payload = msg.payload as {
          id: string
          sender_id: string
          sender_name?: string
          expires_at: string
        }
        const sender = friends.value.find(f => f.user.id === payload.sender_id)
        incomingChallenge.value = {
          challenge_id: payload.id,
          sender_id: payload.sender_id,
          sender_name: payload.sender_name || sender?.user.username || 'A player',
          expires_at: payload.expires_at,
        }
        toast.addToast('You received a match challenge!', 'info')
        break
      }
      // Accepted and declined are addressed to the challenger only, so they
      // clear the outgoing invitation and leave a received one alone.
      case 'challenge_accepted': {
        toast.addToast('Challenge accepted! Preparing match...', 'success')
        outgoingChallenge.value = null
        socketStore.startMatchmaking('casual')
        break
      }
      case 'challenge_declined': {
        toast.addToast('Your challenge was declined', 'error')
        outgoingChallenge.value = null
        break
      }
      case 'challenge_expired': {
        // Both players are told, so the id decides which side to clear.
        const payload = msg.payload as { challenge_id: string }
        clearChallenge(payload.challenge_id)
        toast.addToast('Challenge expired', 'info')
        break
      }
      case 'challenge_cancelled': {
        const payload = msg.payload as { challenge_id: string }
        if (incomingChallenge.value?.challenge_id === payload.challenge_id) {
          incomingChallenge.value = null
          toast.addToast('The challenger withdrew the invitation', 'info')
        }
        break
      }
    }
  }

  /** Drops whichever side of a challenge carries this id. */
  function clearChallenge(challengeId: string) {
    if (incomingChallenge.value?.challenge_id === challengeId) {
      incomingChallenge.value = null
    }
    if (outgoingChallenge.value?.challenge_id === challengeId) {
      outgoingChallenge.value = null
    }
  }

  async function issueChallenge(receiverId: string, receiverName: string) {
    const challenge = await sendChallenge(receiverId)
    outgoingChallenge.value = {
      challenge_id: challenge.id,
      receiver_id: receiverId,
      receiver_name: receiverName,
      expires_at: challenge.expires_at,
    }
  }

  async function cancelOutgoingChallenge() {
    if (!outgoingChallenge.value) return
    const receiverId = outgoingChallenge.value.receiver_id
    outgoingChallenge.value = null
    try {
      await cancelChallenge(receiverId)
    } catch {
      // The invitation was already answered or expired; either way it is gone.
    }
  }

  async function acceptIncomingChallenge() {
    if (!incomingChallenge.value) return
    const senderId = incomingChallenge.value.sender_id
    incomingChallenge.value = null
    const socketStore = useSocketStore()
    try {
      await acceptChallenge(senderId)
      socketStore.startMatchmaking('casual')
    } catch (err: any) {
      toast.addToast(err?.message || 'Failed to accept challenge', 'error')
    }
  }

  async function declineIncomingChallenge() {
    if (!incomingChallenge.value) return
    const senderId = incomingChallenge.value.sender_id
    incomingChallenge.value = null
    try {
      await declineChallenge(senderId)
    } catch {
      // Quiet failure
    }
  }

  return {
    isConnected,
    friends,
    incomingRequests,
    incomingChallenge,
    outgoingChallenge,
    connect,
    disconnect,
    fetchInitialData,
    issueChallenge,
    cancelOutgoingChallenge,
    acceptIncomingChallenge,
    declineIncomingChallenge,
  }
})

