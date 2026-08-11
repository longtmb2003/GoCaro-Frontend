import type { SpiritDefinition } from '../spiritTypes'

/**
 * Wolf — fast and blunt. No wind-up worth speaking of: it is already moving when
 * it appears, and the strike is over before the dust settles. The deliberate
 * counterweight to the dragon.
 */
export const wolfSpirit: SpiritDefinition = {
  id: 'wolf',
  name: { en: 'Wolf', vi: 'Sói' },
  personality: {
    en: 'Already moving before you notice it arrived.',
    vi: 'Đã lao đi trước khi bạn kịp nhận ra nó xuất hiện.',
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
    accentToken: '--color-rank-silver',
    trailToken: '--color-accent',
    particleCount: 5,
    particleSpread: 96,
  },
  sfx: {
    spawn: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.1,
        fromFrequency: 320,
        toFrequency: 460,
        peakGain: 0.018,
        attack: 0.008,
      },
    ],
    attack: [
      {
        type: 'square',
        delay: 0,
        duration: 0.07,
        fromFrequency: 880,
        toFrequency: 520,
        peakGain: 0.02,
        attack: 0.004,
      },
      {
        type: 'triangle',
        delay: 0.03,
        duration: 0.09,
        fromFrequency: 660,
        toFrequency: 392,
        peakGain: 0.016,
        attack: 0.004,
      },
    ],
    impact: [
      {
        type: 'triangle',
        delay: 0,
        duration: 0.12,
        fromFrequency: 196,
        toFrequency: 98,
        peakGain: 0.042,
        attack: 0.005,
      },
    ],
  },
  voice: null,
  result: {
    victory: 'swift-pounce',
    defeat: 'guarded-retreat',
    victoryLine: { en: 'The pack claims the field.', vi: 'Bầy sói đã làm chủ chiến địa.' },
    defeatLine: { en: 'The wolf returns to the hunt.', vi: 'Sói sẽ trở lại cuộc săn.' },
  },
}
