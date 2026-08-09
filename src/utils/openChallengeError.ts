import { ApiError } from '@/api/ApiError'

const OPEN_CHALLENGE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_INVITE_CODE: "This room doesn't exist or has expired.",
  OPPONENT_OFFLINE: 'The room host is no longer online. Ask them to create a new room.',
  OPPONENT_BUSY: 'The room host is already in a match.',
  ALREADY_IN_MATCH: 'You are already in a match. Finish it first.',
  CANNOT_CHALLENGE_SELF: "You can't join your own room.",
}

export function openChallengeErrorMessage(
  error: unknown,
  fallback = 'Unable to check the room. Please try again.',
): string {
  if (!(error instanceof ApiError)) return fallback
  return OPEN_CHALLENGE_ERROR_MESSAGES[error.code] ?? (error.message || fallback)
}
