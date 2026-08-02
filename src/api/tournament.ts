import type { Envelope } from './envelope'
import { http } from './http'
import type {
  TournamentBracket,
  TournamentDetail,
  TournamentListPage,
} from '@/types/tournament'

/**
 * Fetches one page of the tournament list, newest first. An omitted status
 * lists every tournament; the backend refuses a status it does not recognise
 * rather than answering with an empty page.
 */
export async function listTournaments(
  page: number,
  limit: number,
  status?: string,
): Promise<TournamentListPage> {
  const params: Record<string, string | number> = { page, limit }
  if (status !== undefined) {
    params.status = status
  }
  const { data } = await http.get<Envelope<TournamentListPage>>('/api/tournaments', { params })
  return data.data
}

/** Fetches one tournament with its field. */
export async function fetchTournament(id: string): Promise<TournamentDetail> {
  const { data } = await http.get<Envelope<TournamentDetail>>(`/api/tournaments/${id}`)
  return data.data
}

/** Fetches a tournament's bracket. It is empty until the field fills. */
export async function fetchBracket(id: string): Promise<TournamentBracket> {
  const { data } = await http.get<Envelope<TournamentBracket>>(`/api/tournaments/${id}/bracket`)
  return data.data
}

/** Creates a new tournament. The caller becomes its organizer. */
export async function createTournament(name: string, maxPlayers: number): Promise<TournamentDetail> {
  const { data } = await http.post<Envelope<TournamentDetail>>('/api/tournaments', {
    name,
    max_players: maxPlayers,
  })
  return data.data
}

/** Enters the current user into a tournament. */
export async function registerTournament(id: string): Promise<TournamentDetail> {
  const { data } = await http.post<Envelope<TournamentDetail>>(`/api/tournaments/${id}/register`)
  return data.data
}

/** Withdraws the current user from a tournament. */
export async function withdrawTournament(id: string): Promise<void> {
  await http.delete(`/api/tournaments/${id}/register`)
}

/** Starts a ready tournament. Caller must be the organizer. */
export async function startTournament(id: string): Promise<TournamentDetail> {
  const { data } = await http.post<Envelope<TournamentDetail>>(`/api/tournaments/${id}/start`)
  return data.data
}
