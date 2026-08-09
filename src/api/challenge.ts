import { http } from './http'

export interface CreateChallengeResponse {
  code: string
}

export interface OpenChallengeValidation {
  valid: true
  expires_at: string
}

export async function createOpenChallenge(): Promise<CreateChallengeResponse> {
  const response = await http.post<CreateChallengeResponse>('/api/challenges/open')
  return response.data
}

export async function acceptOpenChallenge(code: string): Promise<void> {
  await http.post(`/api/challenges/open/${encodeURIComponent(code)}/accept`)
}

export async function validateOpenChallenge(code: string): Promise<OpenChallengeValidation> {
  const response = await http.get<OpenChallengeValidation>(
    `/api/challenges/open/${encodeURIComponent(code)}`,
  )
  return response.data
}
