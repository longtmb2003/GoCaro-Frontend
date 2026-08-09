import { computed, readonly, ref } from 'vue'

import type { SpiritMotionProfile } from '@/components/board-renderer/spiritTiming'

const SPIRIT_MOTION_STORAGE_KEY = 'gocaro.spiritMotion'
const SPIRIT_MOTION_FORCE_KEY = 'gocaro.spiritMotionForce'

export const SPIRIT_MOTION_OPTIONS = [
  { value: 'full', label: { en: 'Full', vi: 'Đầy đủ' } },
  { value: 'quick', label: { en: 'Quick', vi: 'Nhanh' } },
  { value: 'off', label: { en: 'Off', vi: 'Tắt' } },
] as const satisfies ReadonlyArray<{
  value: SpiritMotionProfile
  label: { en: string; vi: string }
}>

function isProfile(value: string | null): value is SpiritMotionProfile {
  return value === 'full' || value === 'quick' || value === 'off'
}

function storedProfile(): SpiritMotionProfile {
  if (typeof window === 'undefined') return 'full'
  const stored = window.localStorage.getItem(SPIRIT_MOTION_STORAGE_KEY)
  return isProfile(stored) ? stored : 'full'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function storedForceEnable(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(SPIRIT_MOTION_FORCE_KEY) === 'true'
}

const preference = ref<SpiritMotionProfile>(storedProfile())
const reducedMotion = ref(prefersReducedMotion())
const forceEnable = ref(storedForceEnable())

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (event) => {
      reducedMotion.value = event.matches
    })
}

/**
 * The profile the board actually runs.
 *
 * `prefers-reduced-motion` wins over the stored preference and is not merely a
 * shorter animation: a summon, a travelling strike and an impact burst are
 * exactly the vestibular triggers the setting exists to suppress, so the honest
 * response is no sequence at all. The preference is still remembered, so
 * turning the OS setting off restores the player's choice.
 */
const activeProfile = computed<SpiritMotionProfile>(() => 'full')

function setSpiritMotion(profile: SpiritMotionProfile): void {
  preference.value = profile
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SPIRIT_MOTION_STORAGE_KEY, profile)
  }
}

function setForceEnable(value: boolean): void {
  forceEnable.value = value
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SPIRIT_MOTION_FORCE_KEY, value ? 'true' : 'false')
  }
}

/**
 * Module-level state, matching `useAppLanguage`: the board renderer and the
 * settings menu are in different subtrees and must agree without either owning
 * the other or the value being threaded through props.
 */
export function useSpiritMotion() {
  return {
    profile: activeProfile,
    preference: readonly(preference),
    reducedMotion: readonly(reducedMotion),
    forceEnable: readonly(forceEnable),
    options: SPIRIT_MOTION_OPTIONS,
    setSpiritMotion,
    setForceEnable,
  }
}
