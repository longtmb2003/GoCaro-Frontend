import { http } from './http'

export interface FriendUser {
  id: string
  username: string
  elo: number
}

export interface Friend {
  friendship_id: string
  user: FriendUser
  is_online: boolean
  created_at: string
}

export interface FriendRequest {
  friendship_id: string
  user: FriendUser
  created_at: string
}

export interface Challenge {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  expires_at: string
}

export async function getFriends(): Promise<Friend[]> {
  const response = await http.get('/api/friends')
  return response.data as Friend[]
}

export async function removeFriend(id: string): Promise<void> {
  await http.delete(`/api/friends/${id}`)
}

export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await http.get('/api/friends/requests/incoming')
  return response.data as FriendRequest[]
}

export async function sendFriendRequest(receiverId: string): Promise<void> {
  await http.post('/api/friends/requests', { receiver_id: receiverId })
}

export async function acceptFriendRequest(id: string): Promise<void> {
  await http.post(`/api/friends/requests/${id}/accept`)
}

export async function declineFriendRequest(id: string): Promise<void> {
  await http.post(`/api/friends/requests/${id}/decline`)
}

export async function cancelFriendRequest(id: string): Promise<void> {
  await http.post(`/api/friends/requests/${id}/cancel`)
}

export async function sendChallenge(receiverId: string): Promise<Challenge> {
  const response = await http.post('/api/challenges', { receiver_id: receiverId })
  return response.data as Challenge
}

export async function acceptChallenge(senderId: string): Promise<Challenge> {
  const response = await http.post('/api/challenges/accept', { sender_id: senderId })
  return response.data as Challenge
}

export async function declineChallenge(senderId: string): Promise<Challenge> {
  const response = await http.post('/api/challenges/decline', { sender_id: senderId })
  return response.data as Challenge
}
