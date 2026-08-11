import type { SpiritDefinition } from '../spiritTypes'

export const silverWolfSpirit: SpiritDefinition = {
  id: 'silver_wolf',
  name: { en: 'Silver Wolf', vi: 'Sói Bạc' },
  personality: {
    en: 'A flash of silver in the moonlight, faster than the eye can see.',
    vi: 'Một tia chớp bạc dưới ánh trăng, nhanh hơn mắt thường có thể thấy.',
  },
  anchor: 'right',
  sigil: 'wolf',
  model: { source: '/spirits/silver_wolf-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'dash',
    attack: 'claw',
    strike: 'slash',
    impact: 'dust',
    return: 'blink',
  },
  vfx: {
    accentToken: '--color-rank-silver',
    trailToken: '--color-accent',
    particleCount: 8,
    particleSpread: 120,
  },
  sfx: {
    spawn: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.1,
        fromFrequency: 420,
        toFrequency: 560,
        peakGain: 0.02,
        attack: 0.01,
      },
    ],
    attack: [
      {
        type: 'square',
        delay: 0,
        duration: 0.07,
        fromFrequency: 980,
        toFrequency: 620,
        peakGain: 0.025,
        attack: 0.005,
      },
    ],
    impact: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.15,
        fromFrequency: 250,
        toFrequency: 100,
        peakGain: 0.05,
        attack: 0.01,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'radiant-rise',
    defeat: 'mist-dissolve',
    victoryLine: { en: 'Moonlight marks the winning trail.', vi: 'Ánh trăng soi dấu con đường chiến thắng.' },
    defeatLine: { en: 'The moon will find the wolf again.', vi: 'Ánh trăng sẽ lại tìm thấy sói bạc.' },
  },
}
