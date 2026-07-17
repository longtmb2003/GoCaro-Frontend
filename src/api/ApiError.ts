/**
 * Normalized shape every REST failure is reduced to before leaving the API layer.
 * Stores and UI depend on this instead of Axios internals or raw backend errors.
 */
export class ApiError extends Error {
  /** Machine-readable code, or 'unknown' when the backend supplies none. */
  readonly code: string
  /** HTTP status, absent when the request never reached the backend. */
  readonly status: number | undefined

  constructor(message: string, code: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}
