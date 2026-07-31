import { socketOrigin, SocketManager, type SocketMessage, type SocketCallbacks } from './websocket'

export function socialUrl(): string {
  return `${socketOrigin()}/ws/social`
}

export class SocialSocketManager extends SocketManager {
  private token: string

  constructor(token: string) {
    super()
    this.token = token
  }

  override connect(url: string, callbacks: SocketCallbacks): void {
    const wrappedCallbacks: SocketCallbacks = {
      onOpen: () => {
        // Send the auth frame first
        this.send({ type: 'auth', token: this.token })
        if (callbacks.onOpen) {
          callbacks.onOpen()
        }
      },
      onMessage: (message: SocketMessage) => {
        callbacks.onMessage(message)
      },
      onClose: () => {
        callbacks.onClose()
      }
    }

    super.connect(url, wrappedCallbacks)
  }
}
