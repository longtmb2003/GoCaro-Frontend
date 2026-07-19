/**
 * The one WebSocket frame envelope, in both directions (see BACKEND_CONTRACT.md).
 * `payload` is left as `unknown`; each store narrows it for the frame types it
 * handles.
 */
export interface SocketMessage {
  type: string
  payload?: unknown
}

export interface SocketCallbacks {
  onMessage: (message: SocketMessage) => void
  /** Fired once when the connection ends, whether cleanly or on failure. */
  onClose: () => void
}

/**
 * Builds the matchmaking WebSocket URL. The backend authenticates the socket by
 * a `token` query parameter because browsers cannot set headers on a WebSocket
 * handshake. In development `VITE_API_BASE_URL` is empty and the request is
 * same-origin so the Vite dev server proxies `/ws` to the backend; in production
 * it points at the backend origin, from which the ws(s) scheme is derived.
 */
export function matchmakeUrl(token: string): string {
  const base = import.meta.env.VITE_API_BASE_URL
  const origin = base
    ? base.replace(/^http/, 'ws')
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
  return `${origin}/ws/matchmake?token=${encodeURIComponent(token)}`
}

/**
 * Owns a single raw WebSocket connection: the only place in the app that touches
 * the WebSocket API. Stores drive it; components never see it. Exactly one
 * connection exists per authenticated user (ADR-008), so a new connect closes
 * any previous one first.
 */
export class SocketManager {
  private socket: WebSocket | null = null

  connect(url: string, callbacks: SocketCallbacks): void {
    this.close()

    const socket = new WebSocket(url)
    this.socket = socket

    socket.onmessage = (event: MessageEvent<string>) => {
      const message = parseMessage(event.data)
      if (message !== null) {
        callbacks.onMessage(message)
      }
    }

    // onerror is always followed by onclose, so a single close callback covers
    // both failed handshakes and dropped connections.
    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null
      }
      callbacks.onClose()
    }
  }

  /** Serializes and sends a frame. A no-op when the socket is not open. */
  send(message: SocketMessage): void {
    if (this.socket === null || this.socket.readyState !== WebSocket.OPEN) {
      return
    }
    this.socket.send(JSON.stringify(message))
  }

  close(): void {
    if (this.socket === null) {
      return
    }
    // Detach handlers so the deliberate close does not re-enter onClose.
    this.socket.onmessage = null
    this.socket.onclose = null
    this.socket.close()
    this.socket = null
  }
}

function parseMessage(data: string): SocketMessage | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }
  const record = parsed as Record<string, unknown>
  if (typeof record.type !== 'string') {
    return null
  }
  return { type: record.type, payload: record.payload }
}
