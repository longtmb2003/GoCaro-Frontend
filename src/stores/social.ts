import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SocialSocketManager, socialUrl } from '@/api/socialSocket'
import type { SocketMessage } from '@/api/websocket'
import { ACHIEVEMENTS } from '@/config/achievements'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  getFriends,
  getIncomingRequests,
  sendFriendRequest,
  sendChallenge,
  type Friend,
  type FriendRequest,
} from '@/api/friend'
import { useToast } from '@/composables/useToast'
import { useChatStore } from './chat'
import { useSocketStore } from './socket'
import { useTournamentStore } from './tournament'

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
  const friendRequestPendingIds = ref<string[]>([])
  const sentFriendRequestIds = ref<string[]>([])

  let manager: SocialSocketManager | null = null

  const toast = useToast()
  const { t, language } = useAppLanguage()

  const connect = (token: string) => {
    disconnect()
    
    manager = new SocialSocketManager(token)
    manager.connect(socialUrl(), {
      onOpen: () => {
        isConnected.value = true
        void fetchInitialData()
        
        // Also init chat state
        const chatStore = useChatStore()
        void chatStore.fetchInitialData()
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
    friendRequestPendingIds.value = []
    sentFriendRequestIds.value = []
    useChatStore().reset()
  }

  const fetchInitialData = async () => {
    try {
      const [fData, rData] = await Promise.all([
        getFriends(),
        getIncomingRequests()
      ])
      friends.value = Array.isArray(fData) ? fData : []
      incomingRequests.value = Array.isArray(rData) ? rData : []
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
        void fetchInitialData()
        toast.addToast('You have a new friend request', 'info')
        break
      }
      case 'friend_request_accepted': {
        void fetchInitialData()
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
          sender_name: payload.sender_name || sender?.user.display_name || 'A player',
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
        socketStore.requestMatchmaking('casual')
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
      case 'tournament_started': {
        const payload = msg.payload as { tournament_id: string; name?: string; round?: number }
        const name = payload.name ?? 'Tournament'
        const round = payload.round ? `Round ${String(payload.round)} has started!` : 'Tournament has started!'
        toast.addToast(`${name}: ${round}`, 'info')
        
        const tStore = useTournamentStore()
        tStore.invalidate(payload.tournament_id)
        void tStore.loadTournament(payload.tournament_id)
        break
      }
      case 'tournament_match_ready': {
        const payload = msg.payload as { opponent_display_name?: string }
        const opponent = payload.opponent_display_name ? ` You are facing ${payload.opponent_display_name}.` : ''
        toast.addToast(`Match Ready!${opponent}`, 'info')
        
        if (socketStore.status !== 'searching' && socketStore.status !== 'matched') {
          socketStore.requestMatchmaking('casual')
        }
        break
      }
      case 'tournament_rematch': {
        const payload = msg.payload as { rematch_count?: number; max_rematches?: number }
        const progress = payload.rematch_count && payload.max_rematches 
          ? ` (Rematch ${String(payload.rematch_count)}/${String(payload.max_rematches)})`
          : ''
        toast.addToast(`Match drawn. Replaying${progress}...`, 'info')
        
        if (socketStore.status !== 'searching' && socketStore.status !== 'matched') {
          socketStore.requestMatchmaking('casual')
        }
        break
      }
      case 'tournament_walkover': {
        const payload = msg.payload as { tournament_id: string }
        toast.addToast('Match decided by walkover.', 'info')
        
        const tStore = useTournamentStore()
        tStore.invalidate(payload.tournament_id)
        void tStore.loadTournament(payload.tournament_id)
        break
      }
      case 'tournament_round_finished': {
        const payload = msg.payload as { tournament_id: string; round?: number; next_round?: number }
        const msgText = payload.round && payload.next_round 
          ? `Round ${String(payload.round)} completed! Advancing to Round ${String(payload.next_round)}.`
          : 'Tournament round completed!'
        toast.addToast(msgText, 'info')
        
        const tStore = useTournamentStore()
        tStore.invalidate(payload.tournament_id)
        void tStore.loadTournament(payload.tournament_id)
        break
      }
      case 'tournament_finished': {
        const payload = msg.payload as { tournament_id: string; winner_display_name?: string }
        const winner = payload.winner_display_name ? ` ${payload.winner_display_name} is the champion!` : ''
        toast.addToast(`Tournament complete!${winner}`, 'success')
        
        const tStore = useTournamentStore()
        tStore.invalidate(payload.tournament_id)
        void tStore.loadTournament(payload.tournament_id)
        break
      }
      case 'achievement_unlocked': {
        // coins arrives as a string: the notifier payload is map[string]string
        // on the Go side. Absent when the achievement pays nothing.
        const payload = msg.payload as { achievement_id: string; coins?: string; item_code?: string }
        // Prefer the catalogue's translated name; title-casing the id is the
        // fallback for an achievement the client does not know about yet.
        const known = ACHIEVEMENTS.find((a) => a.id === payload.achievement_id)
        const name = known
          ? known.name[language.value]
          : payload.achievement_id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

        const coins = Number(payload.coins ?? 0)
        const reward = Number.isFinite(coins) && coins > 0 ? ` +${String(coins)} ${t('coins', 'xu')}` : ''
        toast.addToast(`${t('Achievement Unlocked', 'Mở khóa thành tựu')}: ${name}!${reward}`, 'success')
        break
      }
      case 'activity_feed_event': {
        // We trigger a global event here. The ActivityFeed component can listen to it.
        window.dispatchEvent(new CustomEvent('gocaro:activity_feed_updated'))
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

  async function requestFriendship(receiverId: string, receiverName: string): Promise<boolean> {
    if (
      friends.value.some((friend) => friend.user.id === receiverId) ||
      friendRequestPendingIds.value.includes(receiverId) ||
      sentFriendRequestIds.value.includes(receiverId)
    ) {
      return false
    }

    friendRequestPendingIds.value = [...friendRequestPendingIds.value, receiverId]
    try {
      await sendFriendRequest(receiverId)
      sentFriendRequestIds.value = [...sentFriendRequestIds.value, receiverId]
      toast.addToast(`Friend request sent to ${receiverName}.`, 'success')
      return true
    } catch (error: unknown) {
      toast.addToast(error instanceof Error ? error.message : 'Failed to send friend request', 'error')
      return false
    } finally {
      friendRequestPendingIds.value = friendRequestPendingIds.value.filter(
        (id) => id !== receiverId,
      )
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
      socketStore.requestMatchmaking('casual')
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.addToast(err.message || 'Failed to accept challenge', 'error')
      } else {
        toast.addToast('Failed to accept challenge', 'error')
      }
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
    friendRequestPendingIds,
    sentFriendRequestIds,
    connect,
    disconnect,
    fetchInitialData,
    issueChallenge,
    requestFriendship,
    cancelOutgoingChallenge,
    acceptIncomingChallenge,
    declineIncomingChallenge,
  }
})
