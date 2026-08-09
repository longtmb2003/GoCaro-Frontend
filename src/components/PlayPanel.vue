<script setup lang="ts">
import { CirclePlay, Lock, Sparkles } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { MatchmakingMode } from '@/types/game'

const props = withDefaults(
  defineProps<{
    isGuest?: boolean
    joinPending?: boolean
    content?: 'all' | 'matches' | 'rooms'
    /**
     * Seconds left on a matchmaking lockout, 0 when free to queue. The server
     * refuses either mode while it runs, so both cards say so and stop
     * accepting clicks rather than letting the player queue into a refusal.
     */
    lockSecondsLeft?: number
  }>(),
  { isGuest: false, joinPending: false, content: 'all', lockSecondsLeft: 0 },
)

const isLocked = computed(() => props.lockSecondsLeft > 0)
const lockLabel = computed(() => {
  const minutes = Math.floor(props.lockSecondsLeft / 60)
  const seconds = props.lockSecondsLeft % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const emit = defineEmits<{
  play: [mode: MatchmakingMode]
  upgrade: []
  'create-room': []
  'join-code': [code: string]
}>()

const joinCode = ref('')
const { t } = useAppLanguage()

function submitJoin() {
  if (props.joinPending) return
  const code = joinCode.value.trim().toUpperCase()
  if (code.length === 6) {
    emit('join-code', code)
  }
}
</script>

<template>
  <section class="play-panel" :aria-label="t('Play', 'Chơi')">
    <div v-if="props.content !== 'rooms'" class="match-mode-grid">
      <button
        type="button"
        class="match-mode-card match-mode-card--ranked group"
        :class="{ 'match-mode-card--cooldown': isLocked }"
        :disabled="isLocked"
        :aria-describedby="isGuest ? 'ranked-locked' : isLocked ? 'queue-cooldown' : undefined"
        @click="isGuest ? emit('upgrade') : emit('play', 'ranked')"
      >
        <small v-if="isLocked" id="queue-cooldown" class="match-mode-card__cooldown">
          <Lock :size="11" aria-hidden="true" />
          {{ lockLabel }}
        </small>
        <span class="match-mode-card__glow" aria-hidden="true" />
        <span class="match-mode-card__artwork" aria-hidden="true">
          <FantasyIcon type="ranked-match" size="hero" eager />
        </span>
        <span class="match-mode-card__copy">
          <strong>{{ t('RANKED MATCH', 'ĐẤU XẾP HẠNG') }}</strong>
          <small class="match-mode-card__reward">
            {{ t('Ranked ELO · coins · quests', 'Điểm ELO · coin · nhiệm vụ') }}
          </small>
        </span>
        <small v-if="isGuest" id="ranked-locked" class="match-mode-card__locked-copy">
          {{ t('Sign in required', 'Cần đăng nhập') }}
        </small>
      </button>

      <button
        type="button"
        class="match-mode-card match-mode-card--casual group"
        :class="{ 'match-mode-card--cooldown': isLocked }"
        :disabled="isLocked"
        :aria-describedby="isLocked ? 'queue-cooldown-casual' : undefined"
        @click="emit('play', 'casual')"
      >
        <small v-if="isLocked" id="queue-cooldown-casual" class="match-mode-card__cooldown">
          <Lock :size="11" aria-hidden="true" />
          {{ lockLabel }}
        </small>
        <span class="match-mode-card__glow" aria-hidden="true" />
        <span class="match-mode-card__artwork" aria-hidden="true">
          <FantasyIcon type="casual-match" size="hero" eager />
        </span>
        <span class="match-mode-card__copy">
          <strong>{{ t('CASUAL MATCH', 'ĐẤU THƯỜNG') }}</strong>
          <small class="match-mode-card__reward match-mode-card__reward--none">
            {{ t('Just for fun · no rewards', 'Chơi vui · không phần thưởng') }}
          </small>
        </span>
      </button>
    </div>

    <div v-if="props.content !== 'matches'" class="room-action-grid">
      <button
        type="button"
        class="launcher-action group"
        @click="isGuest ? emit('upgrade') : emit('create-room')"
      >
        <FantasyIcon type="create-room" size="large" />
        <span class="min-w-0">
          <strong>{{ t('Create Room', 'Tạo phòng') }}</strong>
          <small>{{ isGuest ? t('Sign in required', 'Cần đăng nhập') : t('Invite a friend to play', 'Mời bạn bè cùng chơi') }}</small>
        </span>
        <FantasySystemIcon v-if="isGuest" compact class="ml-auto opacity-60">
          <Lock :size="18" aria-hidden="true" />
        </FantasySystemIcon>
        <FantasySystemIcon v-else compact class="launcher-action__spark">
          <Sparkles :size="18" aria-hidden="true" />
        </FantasySystemIcon>
      </button>

      <form
        class="launcher-action launcher-action--join"
        :aria-busy="props.joinPending"
        @submit.prevent="submitJoin"
      >
        <FantasyIcon type="join-code" size="large" />
        <label class="min-w-0 flex-1" for="lobby-join-code">
          <strong>{{ t('Join Code', 'Mã tham gia') }}</strong>
          <span class="join-code-row">
            <input
              id="lobby-join-code"
              v-model="joinCode"
              type="text"
              maxlength="6"
              :disabled="props.joinPending"
              autocomplete="off"
              spellcheck="false"
              :aria-label="t('Six-letter room code', 'Mã phòng gồm sáu ký tự')"
              :placeholder="t('ENTER CODE', 'NHẬP MÃ')"
            />
            <button
              type="submit"
              :disabled="props.joinPending || joinCode.trim().length !== 6"
              :aria-label="t('Join room', 'Vào phòng')"
            >
              <FantasySystemIcon compact><CirclePlay :size="20" aria-hidden="true" /></FantasySystemIcon>
            </button>
          </span>
        </label>
      </form>
    </div>
  </section>
</template>

<style scoped>
.match-mode-grid,
.room-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.match-mode-grid {
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(9.5rem, 11rem));
  justify-content: start;
}

.match-mode-card {
  position: relative;
  display: flex;
  height: 11.25rem;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  overflow: hidden;
  padding: 0.45rem 0.65rem 0.65rem;
  color: var(--text-foreground);
  text-align: center;
  border: 1px solid rgb(214 181 106 / 0.48);
  border-radius: 1rem;
  background:
    radial-gradient(circle at 50% 2%, rgb(86 183 255 / 0.18), transparent 48%),
    repeating-radial-gradient(circle at 50% 18%, transparent 0 1.15rem, rgb(229 222 210 / 0.018) 1.2rem 1.24rem),
    linear-gradient(165deg, rgb(30 47 62 / 0.97), rgb(9 24 42 / 0.98));
  box-shadow:
    0 1rem 1.8rem rgb(0 3 12 / 0.38),
    0 0 1rem rgb(86 183 255 / 0.08),
    inset 0 1px 0 rgb(229 222 210 / 0.16),
    inset 0 -0.35rem 0.8rem rgb(0 5 16 / 0.24),
    inset 0 0 0 2px rgb(6 16 30 / 0.36);
  -webkit-backdrop-filter: blur(var(--blur-md));
  backdrop-filter: blur(var(--blur-md));
  transition:
    transform 240ms ease-out,
    border-color 240ms ease-out,
    box-shadow 240ms ease-out;
}

.match-mode-card::before {
  position: absolute;
  top: -30%;
  left: -75%;
  width: 44%;
  height: 160%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.12), transparent);
  content: '';
  pointer-events: none;
  transform: rotate(16deg);
  transition: left 260ms ease-out;
}

.match-mode-card::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgb(229 222 210 / 0.07);
  border-radius: calc(var(--radius-card) - 0.25rem);
  background:
    linear-gradient(135deg, rgb(214 181 106 / 0.86) 0 0.18rem, rgb(71 48 22 / 0.82) 0.2rem 0.32rem, transparent 0.34rem) top left / 1.2rem 1.2rem no-repeat,
    linear-gradient(225deg, rgb(214 181 106 / 0.86) 0 0.18rem, rgb(71 48 22 / 0.82) 0.2rem 0.32rem, transparent 0.34rem) top right / 1.2rem 1.2rem no-repeat,
    linear-gradient(45deg, rgb(214 181 106 / 0.72) 0 0.18rem, rgb(71 48 22 / 0.76) 0.2rem 0.32rem, transparent 0.34rem) bottom left / 1.2rem 1.2rem no-repeat,
    linear-gradient(315deg, rgb(214 181 106 / 0.72) 0 0.18rem, rgb(71 48 22 / 0.76) 0.2rem 0.32rem, transparent 0.34rem) bottom right / 1.2rem 1.2rem no-repeat;
  box-shadow: inset 0 0 1rem rgb(0 5 16 / 0.28);
  margin: 0.25rem;
  content: '';
  pointer-events: none;
}

.match-mode-card--ranked {
  border-color: rgb(214 181 106 / 0.62);
  background: linear-gradient(
    165deg,
    rgb(20 42 83 / 0.96),
    rgb(8 22 50 / 0.96) 68%,
    rgb(31 25 43 / 0.94)
  );
  animation: ranked-card-aura 5s ease-in-out infinite alternate;
}

@keyframes ranked-card-aura {
  0% {
    box-shadow:
      0 1rem 1.8rem rgb(0 3 12 / 0.38),
      0 0 0.8rem rgb(211 168 84 / 0.12),
      inset 0 1px 0 rgb(229 222 210 / 0.16);
  }
  100% {
    box-shadow:
      0 1.2rem 2.2rem rgb(0 3 12 / 0.45),
      0 0 1.4rem rgb(211 168 84 / 0.28),
      inset 0 1px 0 rgb(229 222 210 / 0.26);
  }
}

.match-mode-card--casual {
  border-color: rgb(86 183 255 / 0.42);
  background: linear-gradient(
    165deg,
    rgb(15 39 78 / 0.96),
    rgb(15 22 54 / 0.96) 66%,
    rgb(30 19 62 / 0.94)
  );
}

.match-mode-card:hover,
.match-mode-card:focus-visible {
  border-color: rgb(100 224 255 / 0.68);
  box-shadow:
    0 0.9rem 1.9rem rgb(0 0 0 / 0.34),
    0 0 1rem rgb(53 216 255 / 0.16),
    inset 0 1px 0 rgb(255 255 255 / 0.13);
  outline: none;
  transform: translateY(-3px) scale(1.015);
}

.match-mode-card--ranked:hover,
.match-mode-card--ranked:focus-visible {
  border-color: var(--color-warning);
  box-shadow:
    0 0.9rem 1.9rem rgb(0 0 0 / 0.34),
    0 0 1rem rgb(211 168 84 / 0.18),
    inset 0 1px 0 rgb(255 255 255 / 0.13);
}

.match-mode-card:hover::before,
.match-mode-card:focus-visible::before {
  left: 132%;
}

.match-mode-card__glow {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  width: 7rem;
  height: 5rem;
  border-radius: var(--radius-pill);
  background: rgb(53 216 255 / 0.26);
  filter: blur(2rem);
  opacity: 0.24;
  transform: translateX(-50%);
  transition: opacity 240ms ease-out;
}

.match-mode-card--ranked .match-mode-card__glow {
  background: rgb(211 168 84 / 0.3);
}

.match-mode-card:hover .match-mode-card__glow {
  opacity: 0.42;
}

.match-mode-card__artwork {
  position: relative;
  z-index: 2;
  display: block;
  width: 7.6rem;
  height: 7.6rem;
  flex: 0 0 7.6rem;
  margin-bottom: -0.25rem;
  transition: transform 240ms ease-out;
}

.match-mode-card__artwork :deep(.fantasy-icon) {
  width: 100%;
  height: 100%;
  flex-basis: 100%;
}

.match-mode-card--ranked .match-mode-card__artwork {
  width: 7.95rem;
  height: 7.95rem;
  flex-basis: 7.95rem;
}

.match-mode-card:hover .match-mode-card__artwork,
.match-mode-card:focus-visible .match-mode-card__artwork {
  transform: translateY(-0.25rem);
}

.match-mode-card__copy {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  padding-top: 0.2rem;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.82);
}

.match-mode-card strong {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: 0.77rem;
  line-height: 1.15;
  letter-spacing: 0.035em;
}

.match-mode-card__copy small,
.launcher-action small {
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.66rem;
  line-height: 1.25;
}

/* Rewards are ranked-only by design: the anti-farm rules in RewardService skip
   casual matches entirely, so both cards say plainly what a match is worth.
   Deliberately no figures — the coin amounts are environment-tunable, and a
   number printed here would drift out of date the first time they are retuned.

   One line per card, and both lines kept to a similar length on purpose: the
   card is a fixed 11.25rem justified to flex-end, so a sub-line that wraps on
   one card and not the other shifts that card's artwork upward — which is how
   the two crests came to sit at different heights. */
.match-mode-card__reward {
  margin-top: 0.2rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-fantasy-gold);
}

.match-mode-card__reward--none {
  color: var(--color-fantasy-stone);
  opacity: 0.65;
  font-weight: 600;
}

.match-mode-card--cooldown {
  cursor: not-allowed;
  filter: grayscale(0.7);
  opacity: 0.6;
}

.match-mode-card__cooldown {
  position: absolute;
  top: 0.45rem;
  left: 0.5rem;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.4rem;
  color: var(--color-error);
  font-size: 0.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  border-radius: var(--radius-pill);
  background: rgb(5 13 29 / 0.82);
}

.match-mode-card__locked-copy {
  position: absolute;
  top: 0.45rem;
  right: 0.5rem;
  z-index: 3;
  padding: 0.2rem 0.35rem;
  color: rgb(245 215 145 / 0.88);
  font-size: 0.58rem;
  border-radius: var(--radius-pill);
  background: rgb(5 13 29 / 0.72);
}

.mode-art-fallback {
  position: absolute;
  inset: 18%;
  display: block;
}

.mode-art-fallback--ranked {
  border: 0.28rem double rgb(231 192 97 / 0.82);
  transform: rotate(45deg);
  box-shadow:
    inset 0 0 1rem rgb(68 161 255 / 0.6),
    0 0 0.8rem rgb(211 168 84 / 0.3);
}

.mode-art-fallback--casual::before,
.mode-art-fallback--casual::after {
  position: absolute;
  top: 5%;
  left: 43%;
  width: 0.45rem;
  height: 90%;
  border-radius: var(--radius-pill);
  background: linear-gradient(#eaf7ff, #35d8ff 72%, #6b5de8);
  box-shadow: 0 0 0.5rem rgb(53 216 255 / 0.35);
  content: '';
  transform: rotate(42deg);
}

.mode-art-fallback--casual::after {
  transform: rotate(-42deg);
}

.launcher-action__icon {
  position: relative;
  z-index: 1;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-accent);
  border: 1px solid rgb(53 216 255 / 0.28);
  border-radius: var(--radius-md);
  background: rgb(53 216 255 / 0.1);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.launcher-action {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  min-height: 5.25rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  color: var(--text-foreground);
  text-align: left;
  border: 1px solid rgb(214 181 106 / 0.4);
  border-radius: var(--radius-card);
  background:
    repeating-linear-gradient(95deg, transparent 0 0.5rem, rgb(229 222 210 / 0.02) 0.55rem 0.6rem),
    linear-gradient(145deg, rgb(43 57 67 / 0.92), rgb(10 25 43 / 0.94));
  box-shadow:
    var(--shadow-card),
    inset 0 1px 0 rgb(229 222 210 / 0.14),
    inset 0 0 0 2px rgb(4 14 27 / 0.32);
  transition:
    transform var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.launcher-action::after {
  position: absolute;
  inset: 0.28rem;
  z-index: 0;
  border: 1px solid rgb(229 222 210 / 0.055);
  border-radius: calc(var(--radius-card) - 0.28rem);
  background:
    linear-gradient(135deg, rgb(214 181 106 / 0.76) 0 0.16rem, rgb(70 47 22 / 0.78) 0.18rem 0.28rem, transparent 0.3rem) top left / 1rem 1rem no-repeat,
    linear-gradient(225deg, rgb(214 181 106 / 0.76) 0 0.16rem, rgb(70 47 22 / 0.78) 0.18rem 0.28rem, transparent 0.3rem) top right / 1rem 1rem no-repeat,
    linear-gradient(45deg, rgb(214 181 106 / 0.62) 0 0.16rem, rgb(70 47 22 / 0.7) 0.18rem 0.28rem, transparent 0.3rem) bottom left / 1rem 1rem no-repeat,
    linear-gradient(315deg, rgb(214 181 106 / 0.62) 0 0.16rem, rgb(70 47 22 / 0.7) 0.18rem 0.28rem, transparent 0.3rem) bottom right / 1rem 1rem no-repeat;
  content: '';
  pointer-events: none;
}

.launcher-action > * {
  position: relative;
  z-index: 1;
}

.launcher-action:hover,
.launcher-action:focus-within {
  border-color: rgb(214 181 106 / 0.72);
  box-shadow:
    var(--shadow-card),
    0 0 16px rgb(86 183 255 / 0.18),
    inset 0 1px 0 rgb(229 222 210 / 0.18);
  transform: translateY(-2px);
}

.launcher-action strong {
  display: block;
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-body);
}

.launcher-action__spark {
  margin-left: auto;
  color: var(--color-warning);
}

.join-code-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.join-code-row input {
  width: 100%;
  min-width: 0;
  padding: 0.25rem 0;
  color: var(--text-foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: 0.14em;
  border: 0;
  border-bottom: 1px solid var(--surface-border-strong);
  outline: 0;
  background: transparent;
}

.join-code-row input::placeholder {
  color: var(--text-disabled);
}

.join-code-row input:focus {
  border-color: var(--color-accent);
}

.join-code-row button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-accent-soft);
}

.join-code-row button:disabled {
  color: var(--text-disabled);
  background: var(--surface-glass-light);
}

@media (max-width: 40rem) {
  .room-action-grid {
    grid-template-columns: 1fr;
  }

  .match-mode-grid {
    grid-template-columns: repeat(2, minmax(0, 9.75rem));
  }
}

@media (max-width: 23rem) {
  .match-mode-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .match-mode-card,
  .match-mode-card--ranked,
  .match-mode-card::before,
  .match-mode-card__artwork,
  .match-mode-card__glow,
  .launcher-action {
    transition: none;
    animation: none !important;
  }

  .match-mode-card:hover,
  .match-mode-card:focus-visible,
  .launcher-action:hover,
  .launcher-action:focus-within {
    transform: none;
  }
}
</style>
