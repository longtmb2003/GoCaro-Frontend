import { http } from './http'
import type { TournamentSummary } from '@/types/tournament'

export interface UserStats {
  matches_played: number
  wins: number
  losses: number
  current_streak: number
  max_streak: number
  coins: number
  daily_matches: number
  last_match_date: string | null
  last_share_date: string | null
}

export interface UserTournamentStats {
  tournaments_joined: number
  championships: number
  best_finish: string
  matches_played: number
  matches_won: number
  win_rate: number
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  unlocked_at: string
}

/**
 * Another player's profile. It carries no phone number: that field is private
 * to its owner and only ever appears on GET /api/profile.
 */
export interface PublicProfile {
  id: string
  /** The unique handle; `display_name` is what to render. */
  username: string
  display_name: string
  /** The chosen name, or '' when this player has never set one. */
  full_name: string
  title: string
  profile_frame: string
  equipped_spirit: string
  elo: number
  global_stats: UserStats
  tournament_stats?: UserTournamentStats
  achievements?: UserAchievement[]
}

export interface UserActivity {
  id: string
  user_id: string
  display_name: string
  activity_type: string
  metadata: Record<string, unknown>
  created_at: string
}

export async function fetchPublicProfile(id: string): Promise<PublicProfile> {
  const { data } = await http.get<PublicProfile>(`/api/users/${id}/profile`)
  return data
}

export async function fetchUserTournaments(
  id: string,
  limit = 20,
  offset = 0
): Promise<{ tournaments: TournamentSummary[]; total: number }> {
  const { data } = await http.get<{ tournaments: TournamentSummary[]; total: number }>(
    `/api/users/${id}/tournaments`,
    { params: { limit, offset } }
  )
  return data
}

export async function fetchActivityFeed(): Promise<UserActivity[]> {
  const { data } = await http.get<{ activities: UserActivity[] }>('/api/users/me/activities')
  return data.activities
}
