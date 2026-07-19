/** Formats an RFC3339 timestamp as a short local date, e.g. "Jul 18, 2026". */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Shortens a UUID for display where the backend exposes no username. Uses the
 * first segment, which is enough to tell matches apart at a glance.
 */
export function shortId(id: string): string {
  return id.slice(0, 8)
}
