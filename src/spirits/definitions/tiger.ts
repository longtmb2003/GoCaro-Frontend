import type { SpiritDefinition } from '../spiritTypes'

export const tigerSpirit: SpiritDefinition = {
  id: 'tiger',
  name: { en: 'Tiger', vi: 'Hổ' },
  personality: {
    en: 'Fierce and unstoppable, dominating the board with raw power.',
    vi: 'Dữ dội và không thể cản bước, áp đảo bàn cờ bằng sức mạnh nguyên thủy.',
  },
  anchor: 'right',
  sigil: 'tiger',
  model: { source: '/spirits/tiger-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'dash',
    attack: 'claw',
    strike: 'slash',
    impact: 'dust',
    return: 'blink',
  },
  vfx: {
    accentToken: '--color-rank-platinum',
    trailToken: '--color-accent',
    particleCount: 8,
    particleSpread: 100,
  },
  sfx: {
    spawn: [
      {
        type: 'sawtooth',
        delay: 0,
        duration: 0.25,
        fromFrequency: 220,
        toFrequency: 110,
        peakGain: 0.03,
        attack: 0.02,
      },
    ],
    attack: [
      {
        type: 'square',
        delay: 0,
        duration: 0.1,
        fromFrequency: 440,
        toFrequency: 220,
        peakGain: 0.04,
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
        peakGain: 0.06,
        attack: 0.01,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'power-surge',
    defeat: 'guarded-retreat',
    victoryLine: { en: 'One roar settles the board.', vi: 'Một tiếng gầm định đoạt bàn cờ.' },
    defeatLine: { en: 'Strength returns with discipline.', vi: 'Sức mạnh sẽ trở lại cùng sự rèn luyện.' },
  },
}
