import type { SpiritDefinition } from '../spiritTypes'

/**
 * Dragon — deliberate and heavy. It takes its time arriving, roars, then commits
 * to one sustained beam. The slowest wind-up of the roster, so it reads as the
 * spirit that means it.
 */
export const dragonSpirit: SpiritDefinition = {
  id: 'dragon',
  name: { en: 'Celestial Dragon', vi: 'Thiên Long' },
  personality: {
    en: 'Arrives without hurry, and only ever needs one breath.',
    vi: 'Đến thong thả, và chỉ cần một hơi thở duy nhất.',
  },
  anchor: 'left',
  sigil: 'drake',
  model: { source: '/spirits/dragon-chibi-v2.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'fly-in',
    attack: 'fire-breath',
    strike: 'beam',
    impact: 'flame',
    return: 'fade',
  },
  vfx: {
    accentToken: '--color-fantasy-gold',
    trailToken: '--color-warning',
    particleCount: 6,
    particleSpread: 132,
  },
  sfx: {
    spawn: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.22,
        fromFrequency: 82,
        toFrequency: 116,
        peakGain: 0.026,
        attack: 0.05,
      },
    ],
    attack: [
      {
        type: 'sawtooth',
        delay: 0,
        duration: 0.2,
        fromFrequency: 146.83,
        toFrequency: 73.42,
        peakGain: 0.03,
        attack: 0.012,
      },
      {
        type: 'triangle',
        delay: 0.04,
        duration: 0.16,
        fromFrequency: 220,
        toFrequency: 174.61,
        peakGain: 0.018,
        attack: 0.02,
      },
    ],
    impact: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.18,
        fromFrequency: 130.81,
        toFrequency: 61.74,
        peakGain: 0.048,
        attack: 0.006,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'radiant-rise',
    defeat: 'mist-dissolve',
    victoryLine: { en: 'The stars answer your victory.', vi: 'Tinh tú cộng hưởng cùng chiến thắng.' },
    defeatLine: { en: 'The constellation will rise again.', vi: 'Chòm sao sẽ lại trỗi dậy.' },
  },
}
