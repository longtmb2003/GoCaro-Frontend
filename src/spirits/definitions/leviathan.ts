import type { SpiritDefinition } from '../spiritTypes'

export const leviathanSpirit: SpiritDefinition = {
  id: 'leviathan',
  name: { en: 'Leviathan', vi: 'Thủy Thần' },
  personality: {
    en: 'An ancient terror of the deep, drowning the board in despair.',
    vi: 'Nỗi khiếp sợ cổ xưa từ vực thẳm, nhấn chìm bàn cờ trong tuyệt vọng.',
  },
  anchor: 'right',
  sigil: 'drake',
  model: { source: '/spirits/leviathan-chibi.webp', frames: 1, aspectRatio: 1 },
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
    particleSpread: 120,
  },
  sfx: {
    spawn: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.4,
        fromFrequency: 600,
        toFrequency: 200,
        peakGain: 0.02,
        attack: 0.08,
      },
    ],
    attack: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.1,
        fromFrequency: 1000,
        toFrequency: 400,
        peakGain: 0.03,
        attack: 0.02,
      },
    ],
    impact: [
      {
        type: 'sine',
        delay: 0,
        duration: 0.25,
        fromFrequency: 200,
        toFrequency: 50,
        peakGain: 0.05,
        attack: 0.02,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'tidal-crown',
    defeat: 'guarded-retreat',
    victoryLine: { en: 'The deep rises to claim the board.', vi: 'Vực thẳm trỗi dậy chiếm lấy bàn cờ.' },
    defeatLine: { en: 'The deep remembers and protects.', vi: 'Vực sâu ghi nhớ và che chở.' },
  },
}
