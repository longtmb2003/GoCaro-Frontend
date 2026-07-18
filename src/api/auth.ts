import type { Envelope } from './envelope'
import { http } from './http'
import type { AuthUser, Credentials, LoginResult } from '@/types/auth'

export async function register(credentials: Credentials): Promise<AuthUser> {
  const { data } = await http.post<Envelope<AuthUser>>('/api/register', credentials)
  return data.data
}

export async function login(credentials: Credentials): Promise<LoginResult> {
  const { data } = await http.post<Envelope<LoginResult>>('/api/login', credentials)
  return data.data
}

export async function fetchProfile(): Promise<AuthUser> {
  const { data } = await http.get<Envelope<AuthUser>>('/api/profile')
  return data.data
}
