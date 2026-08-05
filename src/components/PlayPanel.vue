<script setup lang="ts">
import { CirclePlay, Lock, Sparkles } from 'lucide-vue-next'
import { ref } from 'vue'

import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import type { MatchmakingMode } from '@/types/game'

const props = withDefaults(
  defineProps<{
    isGuest?: boolean
    content?: 'all' | 'matches' | 'rooms'
  }>(),
  { isGuest: false, content: 'all' },
)

const emit = defineEmits<{
  play: [mode: MatchmakingMode]
  upgrade: []
  'create-room': []
  'join-code': [code: string]
}>()

const joinCode = ref('')

function submitJoin() {
  const code = joinCode.value.trim().toUpperCase()
  if (code.length === 6) {
    emit('join-code', code)
    joinCode.value = ''
  }
}
</script>

<template>
  <section class="play-panel" aria-label="Play">
    <div v-if="props.content !== 'rooms'" class="match-mode-grid">
      <button
        type="button"
        class="match-mode-card match-mode-card--ranked group"
        :aria-describedby="isGuest ? 'ranked-locked' : undefined"
        @click="isGuest ? emit('upgrade') : emit('play', 'ranked')"
      >
        <span class="match-mode-card__glow" aria-hidden="true" />
        <span class="match-mode-card__artwork" aria-hidden="true">
          <FantasyIcon type="ranked-match" size="hero" eager />
        </span>
        <span class="match-mode-card__copy">
          <strong>RANKED MATCH</strong>
          <small>Play competitively for ELO rating</small>
        </span>
        <small v-if="isGuest" id="ranked-locked" class="match-mode-card__locked-copy">
          Sign in required
        </small>
      </button>

      <button
        type="button"
        class="match-mode-card match-mode-card--casual group"
        @click="emit('play', 'casual')"
      >
        <span class="match-mode-card__glow" aria-hidden="true" />
        <span class="match-mode-card__artwork" aria-hidden="true">
          <FantasyIcon type="casual-match" size="hero" eager />
        </span>
        <span class="match-mode-card__copy">
          <strong>CASUAL MATCH</strong>
          <small>Just for fun, no pressure</small>
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
          <strong>Create Room</strong>
          <small>{{ isGuest ? 'Sign in required' : 'Invite a friend to play' }}</small>
        </span>
        <FantasySystemIcon v-if="isGuest" compact class="ml-auto opacity-60">
          <Lock :size="18" aria-hidden="true" />
        </FantasySystemIcon>
        <FantasySystemIcon v-else compact class="launcher-action__spark">
          <Sparkles :size="18" aria-hidden="true" />
        </FantasySystemIcon>
      </button>

      <form class="launcher-action launcher-action--join" @submit.prevent="submitJoin">
        <FantasyIcon type="join-code" size="large" />
        <label class="min-w-0 flex-1" for="lobby-join-code">
          <strong>Join Code</strong>
          <span class="join-code-row">
            <input
              id="lobby-join-code"
              v-model="joinCode"
              type="text"
              maxlength="6"
              autocomplete="off"
              spellcheck="false"
              aria-label="Six-letter room code"
              placeholder="ENTER CODE"
            />
            <button type="submit" :disabled="joinCode.trim().length !== 6" aria-label="Join room">
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
  grid-template-columns: repeat(2, minmax(9.25rem, 10.25rem));
  justify-content: start;
}

.match-mode-card {
  position: relative;
  display: flex;
  height: 10.75rem;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  overflow: hidden;
  padding: 0.45rem 0.65rem 0.7rem;
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
  width: 7.2rem;
  height: 7.2rem;
  flex: 0 0 7.2rem;
  margin-bottom: -0.25rem;
  transition: transform 240ms ease-out;
}

.match-mode-card__artwork :deep(.fantasy-icon) {
  width: 100%;
  height: 100%;
  flex-basis: 100%;
}

.match-mode-card--ranked .match-mode-card__artwork {
  width: 7.55rem;
  height: 7.55rem;
  flex-basis: 7.55rem;
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
  .match-mode-card::before,
  .match-mode-card__artwork,
  .match-mode-card__glow,
  .launcher-action {
    transition: none;
  }

  .match-mode-card:hover,
  .match-mode-card:focus-visible,
  .launcher-action:hover,
  .launcher-action:focus-within {
    transform: none;
  }
}
</style>
