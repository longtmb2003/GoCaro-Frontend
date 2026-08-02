import { http } from './http'

export interface UserSearch {
  id: string
  username: string
  display_name: string
  elo: number
}

export async function searchUsers(query: string): Promise<UserSearch[]> {
  const response = await http.get(`/api/users/search?q=${encodeURIComponent(query)}`)
  return response.data as UserSearch[]
}
