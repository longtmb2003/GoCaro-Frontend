import { useToast } from '@/composables/useToast'

let activeNotification: Notification | null = null

export function useMatchFoundNotification() {
  const { addToast } = useToast()

  async function prepare(): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    try {
      await Notification.requestPermission()
    } catch {
      // Notification permission is optional; matchmaking continues normally.
    }
  }

  function notify(opponent?: string): void {
    addToast(opponent ? `Match found: ${opponent}` : 'Match found!', 'success')
    if (!document.hidden) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    activeNotification?.close()
    activeNotification = new Notification('GoCaro — Match found!', {
      body: opponent ? `${opponent} is ready. Return to the board.` : 'Your opponent is ready.',
      icon: '/favicon-48.png',
      tag: 'gocaro-match-found',
      requireInteraction: true,
    })
    activeNotification.onclick = () => {
      window.focus()
      activeNotification?.close()
    }
  }

  return { prepare, notify }
}
