import type { SpiritDefinition } from '../spiritTypes'

export const emberDragonSpirit: SpiritDefinition = {
  id: 'ember_dragon',
  name: { en: 'Ember Dragon', vi: 'Hỏa Long' },
  personality: {
    en: 'Every victory feeds the flame burning beneath its scales.',
    vi: 'Mỗi chiến thắng lại tiếp thêm sức mạnh cho ngọn lửa dưới lớp vảy.',
  },
  anchor: 'left',
  sigil: 'drake',
  model: { source: '/spirits/ember-dragon-chibi.webp', frames: 1, aspectRatio: 1 },
  motion: {
    spawn: 'fly-in',
    attack: 'fire-breath',
    strike: 'beam',
    impact: 'ember',
    return: 'dissolve',
  },
  vfx: {
    accentToken: '--color-warning-400',
    trailToken: '--color-danger-400',
    particleCount: 10,
    particleSpread: 144,
  },
  sfx: {
    spawn: [
      { type: 'sawtooth', delay: 0, duration: 0.18, fromFrequency: 110, toFrequency: 174.61, peakGain: 0.026, attack: 0.03 },
    ],
    attack: [
      { type: 'sawtooth', delay: 0, duration: 0.22, fromFrequency: 196, toFrequency: 82.41, peakGain: 0.036, attack: 0.012 },
    ],
    impact: [
      { type: 'triangle', delay: 0, duration: 0.2, fromFrequency: 146.83, toFrequency: 55, peakGain: 0.055, attack: 0.006 },
    ],
  },
  voice: null,
  result: {
    victory: 'power-surge',
    defeat: 'ember-fade',
    victoryLine: { en: 'The final line ignites.', vi: 'Đường cờ quyết định bùng cháy.' },
    defeatLine: { en: 'The ember waits beneath the ash.', vi: 'Tàn lửa vẫn chờ dưới lớp tro.' },
  },
}
