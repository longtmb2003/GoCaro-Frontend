import type { SpiritDefinition } from '../spiritTypes'

export const fenrirSpirit: SpiritDefinition = {
  id: 'fenrir',
  name: { en: 'Fenrir', vi: 'Sói Tận Thế' },
  personality: {
    en: 'The legendary wolf, destined to devour the sun.',
    vi: 'Sói thần thoại, kẻ mang định mệnh nuốt chửng mặt trời.',
  },
  anchor: 'right',
  sigil: 'wolf',
  model: { source: '/spirits/wolf-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'dash',
    attack: 'claw',
    strike: 'slash',
    impact: 'dust',
    return: 'blink',
  },
  vfx: {
    accentToken: '--color-rank-mythic',
    trailToken: '--color-accent',
    particleCount: 15,
    particleSpread: 150,
  },
  sfx: {
    spawn: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.15,
        fromFrequency: 220,
        toFrequency: 360,
        peakGain: 0.03,
        attack: 0.02,
      },
    ],
    attack: [
      {
        type: 'square',
        delay: 0,
        duration: 0.1,
        fromFrequency: 880,
        toFrequency: 420,
        peakGain: 0.035,
        attack: 0.01,
      },
    ],
    impact: [
      {
        type: 'sawtooth',
        delay: 0,
        duration: 0.2,
        fromFrequency: 150,
        toFrequency: 50,
        peakGain: 0.08,
        attack: 0.02,
      },
    ],
  },
  voice: null,
}
