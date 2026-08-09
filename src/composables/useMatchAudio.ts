import { readonly, ref } from 'vue'

import { resolveSpirit } from '@/spirits/spiritRegistry'

interface AudioSession {
  gain: GainNode
  sources: Set<OscillatorNode>
  pulseTimer: number | null
  cleanupTimer: number | null
  stopped: boolean
}

/**
 * Exported so a spirit definition can carry its own voice without shipping an
 * audio file: the roster describes tones, this engine schedules them.
 */
export interface ScheduledTone {
  type: OscillatorType
  delay: number
  duration: number
  fromFrequency: number
  toFrequency: number
  peakGain: number
  attack: number
}

const SEARCH_FADE_IN_SECONDS = 0.32
const SEARCH_FADE_OUT_SECONDS = 0.2
const MUSIC_FADE_IN_SECONDS = 1.1
const MUSIC_FADE_OUT_SECONDS = 0.75
const DEFAULT_MASTER_VOLUME = 1.0
const DEFAULT_MUSIC_VOLUME = 0.8
const DEFAULT_SFX_VOLUME = 0.8
const AUDIO_SETTINGS_KEY = 'gocaro.match-audio.v2'
const COMBAT_MUSIC_URL = '/audio/match/fantasy-music.mp3'
const MIN_GAIN = 0.0001

type MusicIntensity = 'waiting' | 'active' | 'tension'
export type MatchSfxName = 'ui' | 'countdown' | 'placement' | 'victory' | 'defeat'

interface StoredAudioSettings {
  muted: boolean
  masterVolume: number
  musicVolume: number
  sfxVolume: number
}

let context: AudioContext | null = null
let masterGain: GainNode | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let musicElement: HTMLAudioElement | null = null
let musicSource: MediaElementAudioSourceNode | null = null
let musicFadeTimer: number | null = null
let searchSession: AudioSession | null = null
let matchFoundSession: AudioSession | null = null
const gameplaySessions = new Set<AudioSession>()
const muted = ref(false)
const masterVolume = ref(DEFAULT_MASTER_VOLUME)
const musicVolume = ref(DEFAULT_MUSIC_VOLUME)
const sfxVolume = ref(DEFAULT_SFX_VOLUME)
const musicIntensity = ref<MusicIntensity>('waiting')
const musicPlaying = ref(false)
let settingsLoaded = false
let pendingMusicStart = false
let musicPlayRequest = 0
let pageLifecycleBound = false
let gameplayCuesBound = false
let lastHoverCueAt = Number.NEGATIVE_INFINITY
let matchFoundVoiceActive = false

function effectiveMasterVolume() {
  return muted.value ? 0 : masterVolume.value
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value))
}

function loadSettings() {
  if (settingsLoaded || typeof window === 'undefined') return
  settingsLoaded = true
  try {
    const rawSettings = window.localStorage.getItem(AUDIO_SETTINGS_KEY)
    if (!rawSettings) return
    const stored = JSON.parse(rawSettings) as Partial<StoredAudioSettings>
    if (typeof stored.muted === 'boolean') muted.value = stored.muted
    if (typeof stored.masterVolume === 'number') masterVolume.value = clampVolume(stored.masterVolume)
    if (typeof stored.musicVolume === 'number') musicVolume.value = clampVolume(stored.musicVolume)
    if (typeof stored.sfxVolume === 'number') sfxVolume.value = clampVolume(stored.sfxVolume)
  } catch {
    // Invalid or unavailable storage should never prevent match audio.
  }
}

function persistSettings() {
  if (typeof window === 'undefined') return
  const settings: StoredAudioSettings = {
    muted: muted.value,
    masterVolume: masterVolume.value,
    musicVolume: musicVolume.value,
    sfxVolume: sfxVolume.value,
  }
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Private browsing or a full storage quota is safe to ignore.
  }
}

function musicIntensityMultiplier() {
  return musicIntensity.value === 'waiting' ? 0.75 : 1
}

function effectiveMusicVolume() {
  return musicVolume.value * musicIntensityMultiplier()
}

function getAudioContext() {
  if (typeof window === 'undefined') return null
  loadSettings()

  if (!context) {
    const audioWindow = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext

    if (!AudioContextConstructor) return null

    context = new AudioContextConstructor()
    masterGain = context.createGain()
    musicGain = context.createGain()
    sfxGain = context.createGain()
    masterGain.gain.value = effectiveMasterVolume()
    musicGain.gain.value = MIN_GAIN
    sfxGain.gain.value = sfxVolume.value
    musicGain.connect(masterGain)
    sfxGain.connect(masterGain)
    masterGain.connect(context.destination)

    if (!pageLifecycleBound) {
      window.addEventListener('pagehide', stopAll, { passive: true })
      pageLifecycleBound = true
    }
  }

  return context
}

function resumeAudioContext(audioContext: AudioContext) {
  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => undefined)
  }
}

function rampGain(gain: AudioParam, target: number, duration: number) {
  if (!context) return

  const now = context.currentTime
  gain.cancelScheduledValues(now)
  gain.setValueAtTime(Math.max(0, gain.value), now)
  gain.linearRampToValueAtTime(Math.max(0, target), now + duration)
}

function clearMusicFadeTimer() {
  if (musicFadeTimer === null) return
  window.clearTimeout(musicFadeTimer)
  musicFadeTimer = null
}

function ensureMusicElement(audioContext: AudioContext) {
  if (!musicGain) return null
  if (!musicElement) {
    musicElement = new Audio(COMBAT_MUSIC_URL)
    musicElement.loop = true
    musicElement.preload = 'auto'
    musicElement.setAttribute('playsinline', '')
  }
  if (!musicSource) {
    musicSource = audioContext.createMediaElementSource(musicElement)
    musicSource.connect(musicGain)
  }
  return musicElement
}

function removeMusicUnlockListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointerdown', retryPendingMusic)
  window.removeEventListener('keydown', retryPendingMusic)
}

function retryPendingMusic() {
  if (!pendingMusicStart) return
  pendingMusicStart = false
  removeMusicUnlockListeners()
  playMusic(musicIntensity.value)
}

function armMusicUnlock() {
  if (typeof window === 'undefined') return
  pendingMusicStart = true
  window.addEventListener('pointerdown', retryPendingMusic, { once: true, passive: true })
  window.addEventListener('keydown', retryPendingMusic, { once: true })
}

function setMusicIntensity(intensity: MusicIntensity) {
  musicIntensity.value = intensity
  if (musicGain && musicPlaying.value) {
    rampGain(musicGain.gain, effectiveMusicVolume(), 0.35)
  }
}

function fadeInMusic(duration = MUSIC_FADE_IN_SECONDS) {
  if (!musicGain) return
  clearMusicFadeTimer()
  rampGain(musicGain.gain, effectiveMusicVolume(), duration)
}

function fadeOutMusic(duration = MUSIC_FADE_OUT_SECONDS, resetPosition = false) {
  if (!musicGain || !musicElement) return
  clearMusicFadeTimer()
  rampGain(musicGain.gain, MIN_GAIN, duration)
  musicFadeTimer = window.setTimeout(() => {
    musicElement?.pause()
    if (resetPosition && musicElement) musicElement.currentTime = 0
    musicPlaying.value = false
    musicFadeTimer = null
  }, duration * 1000 + 40)
}

function playMusic(intensity: MusicIntensity = 'active') {
  const request = ++musicPlayRequest
  setMusicIntensity(intensity)
  const audioContext = getAudioContext()
  if (!audioContext) return
  resumeAudioContext(audioContext)
  const element = ensureMusicElement(audioContext)
  if (!element) return
  clearMusicFadeTimer()

  const playAttempt = element.play()
  void playAttempt.then(() => {
    if (request !== musicPlayRequest) return
    pendingMusicStart = false
    removeMusicUnlockListeners()
    musicPlaying.value = true
    fadeInMusic()
  }).catch(() => {
    if (request !== musicPlayRequest) return
    // Browsers may block media until the next user gesture.
    armMusicUnlock()
  })
}

function pauseMusic() {
  musicPlayRequest += 1
  pendingMusicStart = false
  removeMusicUnlockListeners()
  fadeOutMusic(MUSIC_FADE_OUT_SECONDS)
}

function stopMusic() {
  musicPlayRequest += 1
  pendingMusicStart = false
  removeMusicUnlockListeners()
  fadeOutMusic(MUSIC_FADE_OUT_SECONDS, true)
}

function createSession(audioContext: AudioContext): AudioSession {
  if (!sfxGain) throw new Error('Match audio output is not initialized.')

  const gain = audioContext.createGain()
  gain.gain.value = MIN_GAIN
  gain.connect(sfxGain)

  return {
    gain,
    sources: new Set<OscillatorNode>(),
    pulseTimer: null,
    cleanupTimer: null,
    stopped: false,
  }
}

function registerSource(session: AudioSession, source: OscillatorNode, sourceGain: GainNode) {
  session.sources.add(source)
  source.addEventListener('ended', () => {
    session.sources.delete(source)
    source.disconnect()
    sourceGain.disconnect()
  }, { once: true })
}

function scheduleTone(session: AudioSession, tone: ScheduledTone) {
  if (!context || session.stopped) return

  const startTime = context.currentTime + tone.delay
  const endTime = startTime + tone.duration
  const releaseStart = Math.max(startTime + tone.attack, endTime - Math.min(0.52, tone.duration * 0.7))
  const oscillator = context.createOscillator()
  const toneGain = context.createGain()

  oscillator.type = tone.type
  oscillator.frequency.setValueAtTime(tone.fromFrequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(tone.toFrequency, endTime)

  toneGain.gain.setValueAtTime(MIN_GAIN, startTime)
  toneGain.gain.exponentialRampToValueAtTime(tone.peakGain, startTime + tone.attack)
  toneGain.gain.setValueAtTime(tone.peakGain, releaseStart)
  toneGain.gain.exponentialRampToValueAtTime(MIN_GAIN, endTime)

  oscillator.connect(toneGain)
  toneGain.connect(session.gain)
  registerSource(session, oscillator, toneGain)
  oscillator.start(startTime)
  oscillator.stop(endTime + 0.02)
}

function createAmbientPad(session: AudioSession, frequency: number, gainValue: number) {
  if (!context) return

  const oscillator = context.createOscillator()
  const padGain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  padGain.gain.value = gainValue
  oscillator.connect(padGain)
  padGain.connect(session.gain)
  registerSource(session, oscillator, padGain)
  oscillator.start()
}

function cleanupSession(session: AudioSession) {
  if (session.pulseTimer !== null) {
    window.clearInterval(session.pulseTimer)
    session.pulseTimer = null
  }
  if (session.cleanupTimer !== null) {
    window.clearTimeout(session.cleanupTimer)
    session.cleanupTimer = null
  }

  session.sources.forEach((source) => {
    try {
      source.stop()
    } catch {
      // The source may already have completed its envelope.
    }
  })
  session.sources.clear()
  session.gain.disconnect()
}

function fadeOutSession(session: AudioSession | null, duration: number) {
  if (!session || session.stopped) return

  session.stopped = true
  if (session.pulseTimer !== null) {
    window.clearInterval(session.pulseTimer)
    session.pulseTimer = null
  }
  if (session.cleanupTimer !== null) {
    window.clearTimeout(session.cleanupTimer)
    session.cleanupTimer = null
  }

  rampGain(session.gain.gain, MIN_GAIN, duration)
  session.cleanupTimer = window.setTimeout(
    () => {
      cleanupSession(session)
    },
    duration * 1000 + 50,
  )
}

function stopMatchmakingLoop(duration = SEARCH_FADE_OUT_SECONDS) {
  const session = searchSession
  searchSession = null
  fadeOutSession(session, duration)
}

function stopMatchFoundConfirmation(duration = 0.12) {
  const session = matchFoundSession
  matchFoundSession = null
  fadeOutSession(session, duration)
}

function playGameplayCue(tones: ScheduledTone[], gainValue = 0.5) {
  const audioContext = getAudioContext()
  if (!audioContext || tones.length === 0) return

  resumeAudioContext(audioContext)
  const session = createSession(audioContext)
  gameplaySessions.add(session)
  session.gain.gain.value = gainValue
  tones.forEach((tone) => {
    scheduleTone(session, tone)
  })
  const cueDuration = Math.max(...tones.map((tone) => tone.delay + tone.duration))
  session.cleanupTimer = window.setTimeout(() => {
    cleanupSession(session)
    gameplaySessions.delete(session)
  }, cueDuration * 1000 + 80)
}

function playSfx(name: MatchSfxName) {
  const cues: Record<MatchSfxName, { gain: number, tones: ScheduledTone[] }> = {
    ui: {
      gain: 0.3,
      tones: [{ type: 'triangle', delay: 0, duration: 0.08, fromFrequency: 440, toFrequency: 360, peakGain: 0.014, attack: 0.006 }],
    },
    countdown: {
      gain: 0.58,
      tones: [{ type: 'square', delay: 0, duration: 0.09, fromFrequency: 390, toFrequency: 350, peakGain: 0.022, attack: 0.008 }],
    },
    placement: {
      gain: 0.62,
      tones: [
        { type: 'triangle', delay: 0, duration: 0.16, fromFrequency: 880, toFrequency: 620, peakGain: 0.027, attack: 0.008 },
        { type: 'sine', delay: 0.02, duration: 0.2, fromFrequency: 196, toFrequency: 130.81, peakGain: 0.035, attack: 0.008 },
      ],
    },
    victory: {
      gain: 0.62,
      tones: [
        { type: 'triangle', delay: 0, duration: 0.72, fromFrequency: 392, toFrequency: 783.99, peakGain: 0.045, attack: 0.035 },
        { type: 'sine', delay: 0.18, duration: 0.72, fromFrequency: 659.25, toFrequency: 1174.66, peakGain: 0.032, attack: 0.035 },
      ],
    },
    defeat: {
      gain: 0.62,
      tones: [
        { type: 'sine', delay: 0, duration: 0.8, fromFrequency: 196, toFrequency: 73.42, peakGain: 0.052, attack: 0.025 },
        { type: 'triangle', delay: 0.05, duration: 0.72, fromFrequency: 293.66, toFrequency: 146.83, peakGain: 0.024, attack: 0.04 },
      ],
    },
  }
  const cue = cues[name]
  playGameplayCue(cue.tones, cue.gain)
}

function onHoverCue() {
  const now = performance.now()
  if (now - lastHoverCueAt < 55) return
  lastHoverCueAt = now
  playGameplayCue([{
    type: 'triangle',
    delay: 0,
    duration: 0.07,
    fromFrequency: 620,
    toFrequency: 720,
    peakGain: 0.012,
    attack: 0.01,
  }], 0.28)
}

function onGameUiClick(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return
  if (!target.closest('button:not(:disabled), a[href], input:not(:disabled)')) return
  playGameplayCue([{
    type: 'triangle',
    delay: 0,
    duration: 0.08,
    fromFrequency: 440,
    toFrequency: 360,
    peakGain: 0.014,
    attack: 0.006,
  }], 0.3)
}

function onTimerCue(event: Event) {
  const detail = (event as CustomEvent<{ secondsLeft?: number, tone?: string }>).detail
  const secondsLeft = detail.secondsLeft ?? 0
  setMusicIntensity(secondsLeft <= 10 && secondsLeft > 0 ? 'tension' : 'active')
  if (secondsLeft > 10 || secondsLeft <= 0) return
  const critical = detail.tone === 'critical'
  playGameplayCue([{
    type: critical ? 'square' : 'sine',
    delay: 0,
    duration: critical ? 0.09 : 0.07,
    fromFrequency: critical ? 390 : 520,
    toFrequency: critical ? 350 : 500,
    peakGain: critical ? 0.022 : 0.013,
    attack: 0.008,
  }], critical ? 0.58 : 0.3)
}

function onTurnCue(event: Event) {
  const isLocalTurn = Boolean((event as CustomEvent<{ isLocalTurn?: boolean }>).detail.isLocalTurn)
  playGameplayCue(isLocalTurn
    ? [
        { type: 'triangle', delay: 0, duration: 0.18, fromFrequency: 392, toFrequency: 523.25, peakGain: 0.026, attack: 0.025 },
        { type: 'sine', delay: 0.09, duration: 0.24, fromFrequency: 659.25, toFrequency: 783.99, peakGain: 0.018, attack: 0.02 },
      ]
    : [{ type: 'sine', delay: 0, duration: 0.18, fromFrequency: 293.66, toFrequency: 261.63, peakGain: 0.014, attack: 0.02 }],
  isLocalTurn ? 0.46 : 0.3)
}

function onMoveCue(event: Event) {
  const detail = (event as CustomEvent<{ cue?: string, symbol?: number }>).detail
  if (detail.cue === 'summon') {
    const isKnight = detail.symbol === 1
    playGameplayCue(isKnight
      ? [
          { type: 'triangle', delay: 0, duration: 0.16, fromFrequency: 880, toFrequency: 620, peakGain: 0.027, attack: 0.008 },
          { type: 'sine', delay: 0.02, duration: 0.2, fromFrequency: 196, toFrequency: 130.81, peakGain: 0.035, attack: 0.008 },
        ]
      : [
          { type: 'sawtooth', delay: 0, duration: 0.2, fromFrequency: 98, toFrequency: 164.81, peakGain: 0.02, attack: 0.025 },
          { type: 'sine', delay: 0.035, duration: 0.22, fromFrequency: 220, toFrequency: 146.83, peakGain: 0.03, attack: 0.01 },
        ], 0.62)
  }
  if (detail.cue === 'settle') {
    playGameplayCue([{
      type: 'sine', delay: 0, duration: 0.14, fromFrequency: 120, toFrequency: 74, peakGain: 0.045, attack: 0.006,
    }], 0.62)
  }
}

/**
 * A spirit's own voice. The roster is data, so a new spirit becomes audible the
 * moment its definition exists — nothing here names a spirit or branches on one.
 * Only the three beats a definition declares tones for make a sound; the rest of
 * the sequence stays silent so the placement cue still lands on its own.
 */
function onSpiritCue(event: Event) {
  const detail = (event as CustomEvent<{ cue?: string, spiritId?: string }>).detail
  const cue = detail.cue
  if (cue !== 'spawn' && cue !== 'attack' && cue !== 'impact') return
  const spirit = resolveSpirit(detail.spiritId ?? '')
  const tones = spirit.sfx[cue]
  if (tones.length === 0) return
  // Spawn and attack sit under the placement cue rather than competing with it;
  // impact is the beat the player is actually watching for.
  playGameplayCue(tones, cue === 'impact' ? 0.6 : 0.42)
}

function onResultCue(event: Event) {
  const cue = (event as CustomEvent<{ cue?: string }>).detail.cue
  const defeat = event.type === 'gocaro:defeat-cue'
  if (cue === 'impact' || cue === 'resolve') fadeOutMusic(MUSIC_FADE_OUT_SECONDS)
  if (cue === 'impact') {
    playGameplayCue([
      { type: 'sine', delay: 0, duration: 0.42, fromFrequency: 130.81, toFrequency: 65.41, peakGain: 0.055, attack: 0.012 },
    ], 0.58)
  } else if (cue === 'beam' || cue === 'rune') {
    playGameplayCue([
      { type: 'triangle', delay: 0, duration: 0.5, fromFrequency: defeat ? 220 : 392, toFrequency: defeat ? 174.61 : 783.99, peakGain: 0.03, attack: 0.07 },
    ], 0.52)
  } else if (cue === 'resolve') {
    playGameplayCue(defeat
      ? [
          { type: 'sine', delay: 0, duration: 0.8, fromFrequency: 196, toFrequency: 73.42, peakGain: 0.052, attack: 0.025 },
          { type: 'triangle', delay: 0.05, duration: 0.72, fromFrequency: 293.66, toFrequency: 146.83, peakGain: 0.024, attack: 0.04 },
        ]
      : [
          { type: 'triangle', delay: 0, duration: 0.72, fromFrequency: 392, toFrequency: 783.99, peakGain: 0.045, attack: 0.035 },
          { type: 'sine', delay: 0.18, duration: 0.72, fromFrequency: 659.25, toFrequency: 1174.66, peakGain: 0.032, attack: 0.035 },
        ], 0.62)
  }
}

function bindGameplayCues() {
  if (gameplayCuesBound) return
  window.addEventListener('gocaro:hover-cue', onHoverCue)
  window.addEventListener('gocaro:timer-cue', onTimerCue)
  window.addEventListener('gocaro:turn-cue', onTurnCue)
  window.addEventListener('gocaro:move-cue', onMoveCue)
  window.addEventListener('gocaro:spirit-cue', onSpiritCue)
  window.addEventListener('gocaro:victory-cue', onResultCue)
  window.addEventListener('gocaro:defeat-cue', onResultCue)
  window.addEventListener('pointerdown', onGameUiClick, { capture: true })
  gameplayCuesBound = true
}

function unbindGameplayCues() {
  if (!gameplayCuesBound) return
  window.removeEventListener('gocaro:hover-cue', onHoverCue)
  window.removeEventListener('gocaro:timer-cue', onTimerCue)
  window.removeEventListener('gocaro:turn-cue', onTurnCue)
  window.removeEventListener('gocaro:move-cue', onMoveCue)
  window.removeEventListener('gocaro:spirit-cue', onSpiritCue)
  window.removeEventListener('gocaro:victory-cue', onResultCue)
  window.removeEventListener('gocaro:defeat-cue', onResultCue)
  window.removeEventListener('pointerdown', onGameUiClick, { capture: true })
  gameplayCuesBound = false
}

function playMatchmakingLoop() {
  const audioContext = getAudioContext()
  if (!audioContext) return

  resumeAudioContext(audioContext)
  if (searchSession && !searchSession.stopped) return
  playMusic('waiting')

  stopMatchFoundConfirmation(0.08)
  const session = createSession(audioContext)
  searchSession = session
  createAmbientPad(session, 73.42, 0.05)
  createAmbientPad(session, 110, 0.028)
  rampGain(session.gain.gain, 0.32, SEARCH_FADE_IN_SECONDS)

  const playSearchPulse = () => {
    scheduleTone(session, {
      type: 'triangle',
      delay: 0,
      duration: 0.78,
      fromFrequency: 293.66,
      toFrequency: 440,
      peakGain: 0.032,
      attack: 0.1,
    })
  }

  playSearchPulse()
  session.pulseTimer = window.setInterval(playSearchPulse, 1650)
}

function playMatchFound() {
  const audioContext = getAudioContext()
  if (!audioContext) return

  resumeAudioContext(audioContext)
  stopMatchmakingLoop(0.18)
  if (matchFoundSession && !matchFoundSession.stopped) return

  const session = createSession(audioContext)
  matchFoundSession = session
  session.gain.gain.value = 0.72

  // Soft impact, rising energy and a crystalline confirmation form one short cue.
  scheduleTone(session, {
    type: 'sine',
    delay: 0,
    duration: 0.46,
    fromFrequency: 146.83,
    toFrequency: 92.5,
    peakGain: 0.075,
    attack: 0.018,
  })

  if (!muted.value && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
    const announcement = new SpeechSynthesisUtterance('Match Found')
    const preferredVoice = window.speechSynthesis.getVoices().find((voice) => (
      voice.lang.toLowerCase().startsWith('en')
      && /male|mark|david|daniel|guy/i.test(voice.name)
    ))
    if (preferredVoice) announcement.voice = preferredVoice
    announcement.lang = 'en-US'
    announcement.rate = 0.86
    announcement.pitch = 0.82
    announcement.volume = clampVolume(effectiveMasterVolume() * sfxVolume.value)
    announcement.addEventListener('end', () => {
      matchFoundVoiceActive = false
    }, { once: true })
    matchFoundVoiceActive = true
    window.speechSynthesis.speak(announcement)
  }
  scheduleTone(session, {
    type: 'triangle',
    delay: 0.045,
    duration: 0.72,
    fromFrequency: 329.63,
    toFrequency: 659.25,
    peakGain: 0.06,
    attack: 0.075,
  })
  scheduleTone(session, {
    type: 'sine',
    delay: 0.27,
    duration: 0.86,
    fromFrequency: 987.77,
    toFrequency: 1174.66,
    peakGain: 0.038,
    attack: 0.025,
  })

  session.cleanupTimer = window.setTimeout(() => {
    cleanupSession(session)
    if (matchFoundSession === session) matchFoundSession = null
  }, 1220)
}

function cancelMatchmakingAudio() {
  stopMatchmakingLoop(SEARCH_FADE_OUT_SECONDS)
  stopMatchFoundConfirmation(0.08)
  playMusic('waiting')
}

function enterLobby() {
  unbindGameplayCues()
  playMusic('waiting')
}

function enterMatch() {
  stopMatchmakingLoop(0.15)
  bindGameplayCues()
  playMusic('active')
}

function finishMatch() {
  musicPlayRequest += 1
  pendingMusicStart = false
  removeMusicUnlockListeners()
  fadeOutMusic(MUSIC_FADE_OUT_SECONDS)
}

function stopAll() {
  stopMatchmakingLoop(SEARCH_FADE_OUT_SECONDS)
  stopMatchFoundConfirmation(0.12)
  unbindGameplayCues()
  gameplaySessions.forEach((session) => {
    fadeOutSession(session, 0.08)
  })
  gameplaySessions.clear()
  stopMusic()
  if (matchFoundVoiceActive && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    matchFoundVoiceActive = false
  }
}

function setMuted(nextMuted: boolean) {
  muted.value = nextMuted
  persistSettings()
  if (masterGain) rampGain(masterGain.gain, effectiveMasterVolume(), 0.08)
  if (nextMuted && matchFoundVoiceActive && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    matchFoundVoiceActive = false
  }
}

function setMasterVolume(nextVolume: number) {
  masterVolume.value = clampVolume(nextVolume)
  persistSettings()
  if (masterGain) rampGain(masterGain.gain, effectiveMasterVolume(), 0.08)
}

function setMusicVolume(nextVolume: number) {
  musicVolume.value = clampVolume(nextVolume)
  persistSettings()
  if (musicGain) rampGain(musicGain.gain, effectiveMusicVolume(), 0.08)
}

function setSfxVolume(nextVolume: number) {
  sfxVolume.value = clampVolume(nextVolume)
  persistSettings()
  if (sfxGain) rampGain(sfxGain.gain, sfxVolume.value, 0.08)
}

function toggleMuted() {
  setMuted(!muted.value)
}

function setVolume(nextVolume: number) {
  setMasterVolume(nextVolume)
}

function unlock() {
  const audioContext = getAudioContext()
  if (audioContext) {
    resumeAudioContext(audioContext)
    if (pendingMusicStart) retryPendingMusic()
  }
}

const matchAudioManager = {
  playMatchmakingLoop,
  playMatchFound,
  cancelMatchmakingAudio,
  stopMatchmakingLoop,
  enterLobby,
  enterMatch,
  finishMatch,
  stopAll,
  playMusic,
  pauseMusic,
  stopMusic,
  playSfx,
  fadeInMusic,
  fadeOutMusic,
  setMusicIntensity,
  setMuted,
  toggleMuted,
  setMasterVolume,
  setMusicVolume,
  setSfxVolume,
  setVolume,
  unlock,
  muted: readonly(muted),
  masterVolume: readonly(masterVolume),
  musicVolume: readonly(musicVolume),
  sfxVolume: readonly(sfxVolume),
  musicIntensity: readonly(musicIntensity),
  musicPlaying: readonly(musicPlaying),
}

export function useMatchAudio() {
  loadSettings()
  return matchAudioManager
}
