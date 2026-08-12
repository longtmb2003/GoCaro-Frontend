type GtagCommand = 'config' | 'event' | 'js'
type GtagValue = Date | Record<string, string | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: GtagCommand, target: string | Date, value?: GtagValue) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

/** Loads Google Analytics only when production supplies a valid GA4 id. */
export function initializeAnalytics(): void {
  if (!/^G-[A-Z0-9]+$/i.test(measurementId) || window.gtag) return

  window.dataLayer = window.dataLayer ?? []
  window.gtag = (...args) => {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.append(script)
}

export function trackPageView(path: string, title: string): void {
  if (!window.gtag || !measurementId) return
  window.gtag('event', 'page_view', {
    page_location: `${window.location.origin}${path}`,
    page_title: title,
  })
}
