import type { SpiritDefinition } from '../spiritTypes'

export const eagleSpirit: SpiritDefinition = {
  id: 'eagle',
  name: { en: 'Eagle', vi: 'Đại bàng' },
  personality: {
    en: 'Strikes from above with piercing precision.',
    vi: 'Lao xuống từ trên cao với độ chính xác xuyên thấu.',
  },
  anchor: 'right',
  sigil: 'drake',
  model: { source: '/spirits/eagle-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'dash',
    attack: 'claw',
    strike: 'slash',
    impact: 'dust',
    return: 'blink',
  },
  vfx: {
    accentToken: '--color-rank-bronze',
    trailToken: '--color-accent',
    particleCount: 5,
    particleSpread: 120,
  },
  sfx: {
    spawn: [
      {
        type: 'square',
        delay: 0,
        duration: 0.2,
        fromFrequency: 880,
        toFrequency: 1200,
        peakGain: 0.015,
        attack: 0.05,
      },
    ],
    attack: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.05,
        fromFrequency: 1000,
        toFrequency: 500,
        peakGain: 0.03,
        attack: 0.005,
      },
    ],
    impact: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.15,
        fromFrequency: 400,
        toFrequency: 100,
        peakGain: 0.05,
        attack: 0.01,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'radiant-rise',
    defeat: 'shadow-lower',
    victoryLine: { en: 'Victory belongs to the highest sight.', vi: 'Chiến thắng thuộc về tầm nhìn cao nhất.' },
    defeatLine: { en: 'Fold the wings, then climb again.', vi: 'Khép cánh lại, rồi sẽ bay cao lần nữa.' },
  },
}
