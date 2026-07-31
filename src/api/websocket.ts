import type { MatchmakingMode } from '@/types/game'

/**
 * The one WebSocket frame envelope, in both directions (see BACKEND_CONTRACT.md).
 * `payload` is left as `unknown`; each store narrows it for the frame types it
 * handles.
 */
export interface SocketMessage {
  type: string
  payload?: unknown
  [key: string]: unknown
}

export interface SocketCallbacks {
  onOpen?: () => void
  onMessage: (message: SocketMessage) => void
  /** Fired once when the connection ends, whether cleanly or on failure. */
  onClose: () => void
}

/**
 * Builds the matchmaking WebSocket URL for a queue. The backend authenticates
 * the socket by a `token` query parameter because browsers cannot set headers on
 * a WebSocket handshake. In development `VITE_API_BASE_URL` is empty and the
 * request is same-origin so the Vite dev server proxies `/ws` to the backend; in
 * production it points at the backend origin, from which the ws(s) scheme is
 * derived.
 */
export function matchmakeUrl(token: string, mode: MatchmakingMode): string {
  const path = mode === 'ranked' ? '/ws/matchmake/ranked' : '/ws/matchmake'
  return `${socketOrigin()}${path}?token=${encodeURIComponent(token)}`
}

/**
 * Builds the reconnect WebSocket URL. The backend finds the live match from the
 * token alone — a player is in at most one — so no room id is needed. On a
 * successful upgrade the server answers with a `sync_state` frame; if no live
 * match remains, the handshake is rejected and the browser reports only a failed
 * connection.
 */
export function reconnectUrl(token: string): string {
  return `${socketOrigin()}/ws/reconnect?token=${encodeURIComponent(token)}`
}

/**
 * Derives the ws(s) origin the same way for every socket: same-origin in
 * development so Vite proxies `/ws`, or the configured backend origin in
 * production with its scheme mapped from http(s) to ws(s). Exported so other
 * socket clients (e.g. the lobby) build their URLs the same way.
 */
export function socketOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL
  return base
    ? base.replace(/^http/, 'ws')
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
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

    socket.onopen = () => {
      if (callbacks.onOpen) {
        callbacks.onOpen()
      }
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      const message = parseMessage(event.data)
      if (message !== null) {
        callbacks.onMessage(message)
      }
    }

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
    this.socket.onmessage = null
    this.socket.onclose = null
    this.socket.close()
    this.socket = null
  }
}

/** Parses a raw frame into a SocketMessage, or null if it is not a valid one. */
export function parseMessage(data: string): SocketMessage | null {
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
