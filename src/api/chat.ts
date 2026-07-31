import { http } from './http'
import type { Envelope } from './envelope'

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at?: string
}

export interface LobbyMessage {
  id: string
  sender_id: string
  username: string
  content: string
  created_at: string
}

export async function sendDirectMessage(receiverId: string, content: string): Promise<DirectMessage> {
  const response = await http.post<Envelope<DirectMessage>>('/api/chat/dm', { receiver_id: receiverId, content })
  return response.data.data
}

export async function getDirectMessageHistory(userId: string, limit = 50, cursor?: string): Promise<DirectMessage[]> {
  const params = new URLSearchParams()
  params.set('limit', limit.toString())
  if (cursor) params.set('cursor', cursor)
  const response = await http.get<Envelope<DirectMessage[]>>(`/api/chat/dm/${userId}?${params.toString()}`)
  return response.data.data
}

export async function markAsRead(userId: string, cutoffTime: string): Promise<void> {
  await http.post(`/api/chat/dm/${userId}/read`, { cutoff_time: cutoffTime })
}

export async function getUnreadCounts(): Promise<Record<string, number>> {
  const response = await http.get<Envelope<Record<string, number>>>('/api/chat/unread')
  return response.data.data
}

export async function sendLobbyMessage(content: string): Promise<LobbyMessage> {
  const response = await http.post<Envelope<LobbyMessage>>('/api/chat/lobby', { content })
  return response.data.data
}

export async function getLobbyMessages(): Promise<LobbyMessage[]> {
  const response = await http.get<Envelope<LobbyMessage[]>>('/api/chat/lobby')
  return response.data.data
}
