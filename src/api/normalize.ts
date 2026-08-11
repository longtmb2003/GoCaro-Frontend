/**
 * Go serializes a nil slice as `null`. Collection endpoints still expose an
 * array contract to the UI, so normalize that wire-level difference once at
 * the API boundary.
 */
export function arrayOrEmpty<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

export function recordOrEmpty<T>(
  value: Record<string, T> | null | undefined,
): Record<string, T> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
