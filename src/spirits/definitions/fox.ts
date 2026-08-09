import type { SpiritDefinition } from '../spiritTypes'

export const foxSpirit: SpiritDefinition = {
  id: 'fox',
  name: { en: 'Fox', vi: 'Cáo' },
  personality: {
    en: 'Swift and cunning, leaving illusions in its wake.',
    vi: 'Nhanh nhẹn và xảo quyệt, để lại ảo ảnh sau lưng.',
  },
  anchor: 'right',
  sigil: 'fox',
  model: { source: '/spirits/fox-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'dash',
    attack: 'claw',
    strike: 'slash',
    impact: 'dust',
    return: 'blink',
  },
  vfx: {
    accentToken: '--color-rank-gold',
    trailToken: '--color-accent',
    particleCount: 6,
    particleSpread: 90,
  },
  sfx: {
    spawn: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.15,
        fromFrequency: 440,
        toFrequency: 660,
        peakGain: 0.02,
        attack: 0.01,
      },
    ],
    attack: [
      {
        type: 'sawtooth',
        delay: 0,
        duration: 0.08,
        fromFrequency: 880,
        toFrequency: 440,
        peakGain: 0.025,
        attack: 0.005,
      },
    ],
    impact: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.1,
        fromFrequency: 300,
        toFrequency: 150,
        peakGain: 0.04,
        attack: 0.01,
      },
    ],
  },
  voice: null,
}
