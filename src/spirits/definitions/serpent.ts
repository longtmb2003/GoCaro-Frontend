import type { SpiritDefinition } from '../spiritTypes'

export const serpentSpirit: SpiritDefinition = {
  id: 'serpent',
  name: { en: 'Serpent', vi: 'Rắn' },
  personality: {
    en: 'Patient and venomous, striking when least expected.',
    vi: 'Kiên nhẫn và đầy nọc độc, tung đòn khi ít ai ngờ nhất.',
  },
  anchor: 'right',
  sigil: 'drake',
  model: { source: '/spirits/serpent-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'dash',
    attack: 'claw',
    strike: 'slash',
    impact: 'dust',
    return: 'blink',
  },
  vfx: {
    accentToken: '--color-rank-diamond',
    trailToken: '--color-accent',
    particleCount: 7,
    particleSpread: 80,
  },
  sfx: {
    spawn: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.3,
        fromFrequency: 800,
        toFrequency: 400,
        peakGain: 0.015,
        attack: 0.05,
      },
    ],
    attack: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.08,
        fromFrequency: 1200,
        toFrequency: 600,
        peakGain: 0.02,
        attack: 0.01,
      },
    ],
    impact: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.15,
        fromFrequency: 300,
        toFrequency: 100,
        peakGain: 0.03,
        attack: 0.01,
      },
    ],
  },
  voice: null,
}
