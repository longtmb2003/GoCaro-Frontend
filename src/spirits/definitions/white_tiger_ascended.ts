import type { SpiritDefinition } from '../spiritTypes'

export const whiteTigerAscendedSpirit: SpiritDefinition = {
  id: 'white_tiger_ascended',
  name: { en: 'Ascended Tiger', vi: 'Hổ Trắng Thăng Hoa' },
  personality: {
    en: 'A divine beast roaring with the fury of the heavens.',
    vi: 'Linh thú thần thánh gầm thét với cơn thịnh nộ của thiên đàng.',
  },
  anchor: 'right',
  sigil: 'tiger',
  model: { source: '/spirits/white_tiger_ascended-chibi.webp', frames: 1, aspectRatio: 1 },
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
    particleSpread: 140,
  },
  sfx: {
    spawn: [
      {
        type: 'sawtooth',
        delay: 0,
        duration: 0.35,
        fromFrequency: 180,
        toFrequency: 90,
        peakGain: 0.04,
        attack: 0.03,
      },
    ],
    attack: [
      {
        type: 'square',
        delay: 0,
        duration: 0.15,
        fromFrequency: 380,
        toFrequency: 180,
        peakGain: 0.05,
        attack: 0.02,
      },
    ],
    impact: [
      {
        type: 'sawtooth',
        delay: 0,
        duration: 0.3,
        fromFrequency: 120,
        toFrequency: 40,
        peakGain: 0.1,
        attack: 0.02,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'rune-bloom',
    defeat: 'shadow-lower',
    victoryLine: { en: 'The heavens answer the ascended roar.', vi: 'Thiên giới đáp lời gầm của Bạch Hổ.' },
    defeatLine: { en: 'Ascension continues beyond defeat.', vi: 'Con đường thăng hoa vẫn tiếp tục sau thất bại.' },
  },
}
