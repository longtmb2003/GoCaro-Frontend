<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { MessageCircle, Volume2, VolumeX, MessageSquareOff } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import { useToast } from '@/composables/useToast'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'

const auth = useAuthStore()
const socket = useSocketStore()
const { addToast } = useToast()
const { t } = useAppLanguage()

const content = ref('')
const scrollArea = ref<HTMLElement | null>(null)

// Read straight off the store: a setup store hands out the unwrapped value, so
// copying it here would take a snapshot of the boolean instead of the ref.
const isMuted = computed(() => socket.isMuted)

function scrollToBottom() {
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
}

watch(
  () => socket.chatHistory,
  () => {
    void nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true },
)

onMounted(() => {
  scrollToBottom()
})

function send() {
  const msg = content.value.trim()
  if (!msg) return
  if (msg.length > 500) {
    addToast(t('Message too long (max 500 characters)', 'Tin nhắn quá dài (tối đa 500 ký tự)'), 'error')
    return
  }
  socket.sendGameChat(msg)
  content.value = ''

  // We don't push optimistically here, wait for broadcast from server
}

function toggleMute() {
  socket.isMuted = !socket.isMuted
}
</script>

<template>
  <GlassCard
    as="div"
    body-class="flex min-h-0 flex-1 flex-col"
    class="game-chat relative flex min-h-0 flex-col overflow-hidden !p-3"
  >
    <div class="chat-header mb-2 flex shrink-0 items-center justify-between pb-2">
      <h3
        class="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-foreground-muted"
      >
        <FantasySystemIcon compact>
          <MessageCircle aria-hidden="true" />
        </FantasySystemIcon>
        {{ t('Match chat', 'Chat trong trận') }}
      </h3>
      <button
        type="button"
        class="chat-icon-button text-foreground-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-button"
        :title="isMuted ? t('Unmute opponent', 'Bật tiếng đối thủ') : t('Mute opponent', 'Tắt tiếng đối thủ')"
        :aria-label="isMuted ? t('Unmute opponent', 'Bật tiếng đối thủ') : t('Mute opponent', 'Tắt tiếng đối thủ')"
        :aria-pressed="isMuted"
        @click="toggleMute"
      >
        <VolumeX v-if="isMuted" :size="16" />
        <Volume2 v-else :size="16" />
      </button>
      <span class="chat-divider-ornament" aria-hidden="true"></span>
    </div>

    <!-- Scrollable Messages Area -->
    <div ref="scrollArea" class="min-h-0 flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
      <div
        v-if="isMuted"
        class="flex flex-col items-center justify-center h-full text-foreground-muted gap-2 opacity-50"
      >
        <MessageSquareOff :size="24" />
        <p class="text-small font-medium text-center">{{ t('Chat muted', 'Đã tắt chat') }}</p>
      </div>
      <div
        v-else-if="socket.chatHistory.length === 0"
        class="chat-empty flex h-full flex-col items-center justify-center gap-2 text-foreground-muted"
      >
        <span class="chat-empty-icon" aria-hidden="true">
          <span class="chat-empty-gem">
            <MessageCircle :size="22" />
          </span>
        </span>
        <div class="text-center">
          <p class="text-small font-semibold text-foreground-secondary">{{ t('The channel is quiet', 'Kênh chat đang yên tĩnh') }}</p>
          <p class="mt-1 text-caption opacity-65">{{ t("Send a greeting when you're ready.", 'Gửi lời chào khi bạn sẵn sàng.') }}</p>
        </div>
      </div>

      <template v-else>
        <div
          v-for="(msg, index) in socket.chatHistory"
          :key="index"
          class="flex flex-col"
          :class="[msg.sender_id === auth.user?.id ? 'items-end' : 'items-start']"
        >
          <div
            class="chat-message px-3 py-1 rounded-xl max-w-[88%] break-words"
            :class="[
              msg.sender_id === auth.user?.id
                ? 'bg-primary-600 text-white font-medium rounded-br-sm'
                : 'bg-surface-3 text-foreground rounded-bl-sm hover:bg-surface-4',
            ]"
          >
            <p class="text-small">{{ msg.content }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Input Area -->
    <form class="mt-2 shrink-0 flex items-center gap-2" @submit.prevent="send">
      <input
        v-model="content"
        type="text"
        :placeholder="t('Type a message...', 'Nhập tin nhắn...')"
        autocomplete="off"
        maxlength="500"
        class="chat-input h-11 flex-1 rounded-button border border-border bg-surface-sunken px-3 text-small text-foreground placeholder:text-foreground-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 focus:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="isMuted"
        :aria-label="t('Message', 'Tin nhắn')"
      />
      <BaseButton
        type="submit"
        variant="primary"
        class="w-11 !h-11 px-0 flex justify-center items-center shrink-0 group rounded-button"
        :class="content.trim() && !isMuted ? 'shadow-glow' : 'opacity-70'"
        :disabled="!content.trim() || isMuted"
        :aria-label="t('Send message', 'Gửi tin nhắn')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-transform duration-fast"
          :class="
            content.trim() && !isMuted
              ? 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
              : ''
          "
        >
          <path d="m3 3 3 9-3 9 19-9Z" />
          <path d="M6 12h16" />
        </svg>
      </BaseButton>
    </form>
  </GlassCard>
</template>

<style scoped>
.game-chat {
  isolation: isolate;
  opacity: 0.82;
  transition:
    opacity var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out;
}

.game-chat::before,
.game-chat::after {
  position: absolute;
  content: '';
  pointer-events: none;
}

.game-chat::before {
  z-index: 0;
  inset: 0;
  background:
    radial-gradient(circle at 50% 34%, var(--color-board-ambient), transparent 42%),
    conic-gradient(
      from 22.5deg at 50% 42%,
      transparent 0 11%,
      var(--color-board-rune) 12% 13%,
      transparent 14% 24%,
      var(--color-board-rune) 25% 26%,
      transparent 27% 100%
    ),
    radial-gradient(circle at center, var(--color-board-rune) 0 1px, transparent 1.5px);
  background-size:
    auto,
    8rem 8rem,
    1.5rem 1.5rem;
  opacity: 0.14;
}

.game-chat > * {
  position: relative;
  z-index: 1;
}

.game-chat::after {
  top: 3.25rem;
  right: 12%;
  left: 12%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-board-frame-metal),
    var(--color-board-crystal),
    var(--color-board-frame-metal),
    transparent
  );
  opacity: 0.52;
}

.chat-header {
  position: relative;
  border-bottom: 1px solid var(--color-border-subtle);
}

.chat-divider-ornament {
  position: absolute;
  bottom: -0.25rem;
  left: 50%;
  width: 0.45rem;
  height: 0.45rem;
  border: 1px solid var(--color-board-crystal);
  background: var(--surface-sunken);
  box-shadow: 0 0 0.4rem color-mix(in srgb, var(--color-board-crystal) 38%, transparent);
  transform: translateX(-50%) rotate(45deg);
}

.chat-message {
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 rgb(255 255 255 / 0.055);
  transition:
    transform var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.chat-empty {
  position: relative;
  isolation: isolate;
  opacity: 0.68;
}

.chat-empty::before {
  position: absolute;
  z-index: -1;
  width: min(72%, 8rem);
  aspect-ratio: 1;
  border: 1px solid var(--color-accent);
  background:
    linear-gradient(45deg, transparent 47%, var(--color-accent) 48% 52%, transparent 53%),
    linear-gradient(-45deg, transparent 47%, var(--color-accent) 48% 52%, transparent 53%),
    radial-gradient(
      circle,
      transparent 38%,
      var(--color-accent) 39% 40%,
      transparent 41% 58%,
      var(--color-accent) 59% 60%,
      transparent 61%
    );
  clip-path: polygon(50% 0, 84% 16%, 100% 50%, 84% 84%, 50% 100%, 16% 84%, 0 50%, 16% 16%);
  content: '';
  opacity: 0.055;
  transform: rotate(22.5deg);
}

.chat-empty-icon {
  position: relative;
  display: inline-flex;
  height: 3.5rem;
  width: 3.5rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-board-frame-metal) 76%, var(--color-border));
  background:
    linear-gradient(145deg, var(--color-board-surface-reflection), transparent 42%),
    color-mix(in srgb, var(--surface-sunken) 90%, var(--color-fantasy-navy));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 16%, transparent),
    inset 0 -3px 5px color-mix(in srgb, var(--color-piece-contact) 44%, transparent),
    0 0.4rem 0.8rem color-mix(in srgb, var(--color-piece-contact) 42%, transparent);
  color: var(--color-accent);
  clip-path: polygon(50% 0, 90% 22%, 100% 62%, 72% 100%, 28% 100%, 0 62%, 10% 22%);
}

.chat-empty-icon::after {
  position: absolute;
  inset: 0.35rem;
  border: 1px solid color-mix(in srgb, var(--color-board-crystal) 42%, transparent);
  clip-path: inherit;
  content: '';
}

.chat-empty-gem {
  display: inline-grid;
  place-items: center;
  filter: drop-shadow(0 0 0.35rem color-mix(in srgb, var(--color-accent-glow) 58%, transparent));
}

.chat-message:hover {
  box-shadow:
    var(--shadow-md),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.chat-input {
  border-color: color-mix(in srgb, var(--color-board-frame-metal) 72%, var(--color-border));
  background:
    radial-gradient(circle at 18% 0%, var(--color-board-surface-reflection), transparent 34%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-sunken) 94%, var(--color-fantasy-navy)),
      color-mix(in srgb, var(--surface-background) 96%, var(--color-piece-contact))
    );
  box-shadow:
    inset 0 2px 5px color-mix(in srgb, var(--color-piece-contact) 54%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 8%, transparent),
    0 0.25rem 0.5rem color-mix(in srgb, var(--color-piece-contact) 28%, transparent);
  transition:
    color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.chat-input:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-board-crystal) 48%, var(--color-border-strong));
}

.chat-input:focus {
  box-shadow:
    inset 0 2px 5px color-mix(in srgb, var(--color-piece-contact) 54%, transparent),
    0 0 0.65rem color-mix(in srgb, var(--color-accent-glow) 42%, transparent);
}

.game-chat:focus-within,
.game-chat:hover {
  border-color: var(--color-border-strong);
  opacity: 1;
}

.chat-icon-button {
  display: inline-flex;
  min-height: 2.75rem;
  min-width: 2.75rem;
  align-items: center;
  justify-content: center;
  transition:
    color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    transform var(--transition-duration-instant) ease-out;
}

.chat-icon-button:hover {
  background: var(--color-accent-soft);
  transform: translateY(-2px) scale(1.02);
}

.chat-icon-button:active {
  transform: scale(0.98);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: var(--radius-pill);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-glow);
}

@media (prefers-reduced-motion: reduce) {
  .game-chat,
  .chat-message,
  .chat-input,
  .chat-icon-button {
    transition: none;
  }

  .chat-message:hover {
    transform: none;
  }
}
</style>
