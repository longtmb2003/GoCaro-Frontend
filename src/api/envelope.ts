/** Shared REST success envelope. Every endpoint wraps its payload in this. */
export interface Envelope<T> {
  success: boolean
  data: T
}
