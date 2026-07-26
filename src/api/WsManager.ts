import { parseMessage, socketOrigin, type SocketMessage } from './websocket'

/** Default wait before an auto-reconnect attempt. */
const DEFAULT_RECONNECT_DELAY_MS = 3_000

export interface WsManagerOptions {
  /** Backend path, e.g. `/ws/lobby`. The origin and token are added on connect. */
  url: string
  /** Reopen the socket after an unexpected close. A manual `close()` never reopens. */
  autoReconnect?: boolean
  /** Delay between reconnect attempts; defaults to 3s. */
  reconnectDelayMs?: number
  onMessage: (message: SocketMessage) => void
  onOpen?: () => void
  onError?: (error: Event) => void
}

/**
 * A small reconnecting WebSocket client for long-lived, low-stakes connections
 * such as the lobby's online-user feed.
 *
 * It is deliberately separate from SocketManager: a match connection has a
 * single, precise lifecycle and recovers through the game's own `/ws/reconnect`
 * flow, so it must never silently reopen. The lobby is the opposite — it should
 * quietly come back whenever the link drops — so that behaviour lives here
 * rather than complicating SocketManager.
 */
export class WsManager {
  private socket: WebSocket | null = null
  private token: string | null = null
  private manuallyClosed = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly options: WsManagerOptions) {}

  /**
   * Opens the connection, remembering the token for any later reconnect. The
   * backend authenticates by a `token` query parameter, so it is appended here.
   */
  connect(token: string | null): void {
    this.manuallyClosed = false
    this.token = token
    this.open()
  }

  private open(): void {
    this.clearReconnectTimer()

    const query = this.token === null ? '' : `?token=${encodeURIComponent(this.token)}`
    const socket = new WebSocket(`${socketOrigin()}${this.options.url}${query}`)
    this.socket = socket

    socket.onopen = () => this.options.onOpen?.()

    socket.onmessage = (event: MessageEvent<string>) => {
      const message = parseMessage(event.data)
      if (message !== null) {
        this.options.onMessage(message)
      }
    }

    socket.onerror = (event: Event) => this.options.onError?.(event)

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null
      }
      // Only an unexpected drop reconnects; a manual close stays closed.
      if (!this.manuallyClosed && this.options.autoReconnect === true) {
        this.scheduleReconnect()
      }
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      this.open()
    }, this.options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /** Serializes and sends a frame. A no-op when the socket is not open. */
  send(message: SocketMessage): void {
    if (this.socket === null || this.socket.readyState !== WebSocket.OPEN) {
      return
    }
    this.socket.send(JSON.stringify(message))
  }

  /** Closes for good: cancels any pending reconnect and will not reopen. */
  close(): void {
    this.manuallyClosed = true
    this.clearReconnectTimer()
    if (this.socket === null) {
      return
    }
    this.socket.onopen = null
    this.socket.onmessage = null
    this.socket.onerror = null
    this.socket.onclose = null
    this.socket.close()
    this.socket = null
  }
}
