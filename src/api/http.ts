import axios from 'axios'
import type { AxiosInstance } from 'axios'

import { ApiError } from './ApiError'

const REQUEST_TIMEOUT_MS = 10_000

const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.'
const FALLBACK_ERROR_MESSAGE = 'The request could not be completed. Please try again.'

interface BackendErrorBody {
  code?: string
  message?: string
}

function readErrorBody(data: unknown): BackendErrorBody {
  if (typeof data !== 'object' || data === null) {
    return {}
  }

  const body = data as Record<string, unknown>

  return {
    code: typeof body.code === 'string' ? body.code : undefined,
    message: typeof body.message === 'string' ? body.message : undefined,
  }
}

/**
 * Backend messages are surfaced only for client errors (4xx), which describe what
 * the user did wrong. Server errors (5xx) may carry internal detail, so they are
 * always replaced with a generic message.
 */
function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError(FALLBACK_ERROR_MESSAGE, 'unknown')
  }

  const status = error.response?.status

  if (status === undefined) {
    return new ApiError(NETWORK_ERROR_MESSAGE, 'network_error')
  }

  const body = readErrorBody(error.response?.data)
  const code = body.code ?? 'unknown'

  if (status >= 500) {
    return new ApiError(SERVER_ERROR_MESSAGE, code, status)
  }

  return new ApiError(body.message ?? FALLBACK_ERROR_MESSAGE, code, status)
}

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)

/**
 * Sets or clears the bearer token sent on every subsequent request. The Auth
 * store owns the token and calls this when it changes, so the API layer never
 * needs to depend on the store.
 */
export function setAuthToken(token: string | null): void {
  if (token === null) {
    delete http.defaults.headers.common['Authorization']
    return
  }
  http.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
