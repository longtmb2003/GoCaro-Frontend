import type { SpiritDefinition } from '../spiritTypes'

export const guardianDragonSpirit: SpiritDefinition = {
  id: 'guardian_dragon',
  name: { en: 'Guardian Dragon', vi: 'Hộ Long' },
  personality: {
    en: 'A patient sentinel whose wings close before danger reaches its keeper.',
    vi: 'Kẻ canh giữ kiên định, khép đôi cánh trước khi hiểm nguy chạm đến chủ nhân.',
  },
  anchor: 'right',
  sigil: 'drake',
  model: { source: '/spirits/guardian-dragon-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'teleport',
    attack: 'rune-cast',
    strike: 'orb',
    impact: 'rune',
    return: 'fade',
  },
  vfx: {
    accentToken: '--color-fantasy-cyan',
    trailToken: '--color-fantasy-gold',
    particleCount: 8,
    particleSpread: 112,
  },
  sfx: {
    spawn: [
      { type: 'sine', delay: 0, duration: 0.28, fromFrequency: 220, toFrequency: 329.63, peakGain: 0.022, attack: 0.06 },
    ],
    attack: [
      { type: 'triangle', delay: 0, duration: 0.18, fromFrequency: 261.63, toFrequency: 392, peakGain: 0.025, attack: 0.03 },
    ],
    impact: [
      { type: 'sine', delay: 0, duration: 0.3, fromFrequency: 392, toFrequency: 196, peakGain: 0.038, attack: 0.015 },
    ],
  },
  voice: null,
  result: {
    victory: 'rune-bloom',
    defeat: 'guarded-retreat',
    victoryLine: { en: 'The guardian seals your triumph.', vi: 'Hộ Long khắc ấn chiến thắng.' },
    defeatLine: { en: 'The shield holds. Return stronger.', vi: 'Lá chắn vẫn còn. Hãy trở lại mạnh mẽ hơn.' },
  },
}
