<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Lock, MessageSquare, UserPlus, Users, X } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  isGuest: boolean
  friendRequests: number
  unreadMessages: number
}>()

const emit = defineEmits<{
  (event: 'friends' | 'chat' | 'upgrade'): void
}>()

const open = ref(false)
const { t } = useAppLanguage()
const root = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)

const totalNotifications = computed(() => props.friendRequests + props.unreadMessages)

async function toggle(): Promise<void> {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  menu.value?.querySelector<HTMLButtonElement>('[data-social-primary]')?.focus()
}

function close(restoreFocus = false): void {
  open.value = false
  if (restoreFocus) {
    root.value?.querySelector<HTMLButtonElement>('.social-menu__trigger')?.focus()
  }
}

function select(action: 'friends' | 'chat' | 'upgrade'): void {
  close()
  emit(action)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    close(true)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="social-menu">
    <button
      type="button"
      class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-white/60 hover:text-white hover:bg-white/10 border border-transparent cursor-pointer relative"
      :class="{ '!text-white !bg-white/10': open }"
      aria-haspopup="dialog"
      aria-controls="lobby-social-menu"
      :aria-expanded="open"
      :aria-label="
        isGuest
          ? t('Friends and chat · account required', 'Bạn bè và trò chuyện · cần tài khoản')
          : t('Friends and chat', 'Bạn bè và trò chuyện')
      "
      :title="t('Friends & Chat', 'Bạn bè & Chat')"
      @click="toggle"
    >
      <span class="relative flex items-center justify-center">
        <FantasyIcon type="friends" size="small" />
        <Lock v-if="isGuest" class="w-3 h-3 text-amber-400 absolute -bottom-1 -right-1" />
      </span>
      <span>{{ t('Friends & Chat', 'Bạn bè & Chat') }}</span>
      <span v-if="totalNotifications > 0" class="flex h-2 w-2 rounded-full bg-red-500 animate-pulse absolute -top-0.5 -right-0.5" />
    </button>

    <div v-if="open" class="social-menu__backdrop" aria-hidden="true" @click="close()" />
    <section
      v-if="open"
      id="lobby-social-menu"
      ref="menu"
      class="social-menu__popover"
      role="dialog"
      aria-modal="false"
      :aria-label="t('Friends and chat', 'Bạn bè và trò chuyện')"
    >
      <header class="social-menu__header">
        <div>
          <strong>{{ isGuest ? t('Play together', 'Chơi cùng nhau') : t('Social', 'Kết nối') }}</strong>
          <p>
            {{
              isGuest
                ? t(
                    'Create an account to add friends, chat and keep your conversations.',
                    'Tạo tài khoản để kết bạn, trò chuyện và lưu các cuộc hội thoại.',
                  )
                : t('Friends and conversations in one place.', 'Bạn bè và hội thoại ở cùng một nơi.')
            }}
          </p>
        </div>
        <button
          type="button"
          :aria-label="t('Close social menu', 'Đóng menu kết nối')"
          @click="close(true)"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </header>

      <template v-if="isGuest">
        <div
          class="social-menu__locked-list"
          :aria-label="t('Account features', 'Tính năng tài khoản')"
        >
          <div>
            <Users :size="18" aria-hidden="true" />
            <span
              ><strong>{{ t('Friends', 'Bạn bè') }}</strong
              ><small>{{ t('Add players and invite them again.', 'Kết bạn và mời họ chơi lại.') }}</small></span
            >
            <Lock :size="15" aria-hidden="true" />
          </div>
          <div>
            <MessageSquare :size="18" aria-hidden="true" />
            <span
              ><strong>{{ t('Chat', 'Trò chuyện') }}</strong
              ><small>{{ t('Keep direct messages between sessions.', 'Giữ tin nhắn qua các phiên chơi.') }}</small></span
            >
            <Lock :size="15" aria-hidden="true" />
          </div>
        </div>
        <BaseButton data-social-primary class="w-full" @click="select('upgrade')">
          <UserPlus :size="18" aria-hidden="true" /> {{ t('Create free account', 'Tạo tài khoản miễn phí') }}
        </BaseButton>
        <p class="social-menu__assurance">
          {{ t('Your rating and match history will be preserved.', 'Điểm xếp hạng và lịch sử trận sẽ được giữ lại.') }}
        </p>
      </template>

      <div v-else class="social-menu__actions">
        <button type="button" data-social-primary @click="select('friends')">
          <Users :size="20" aria-hidden="true" />
          <span
            ><strong>{{ t('Friends', 'Bạn bè') }}</strong
            ><small>{{ t('Requests and online friends', 'Lời mời và bạn đang trực tuyến') }}</small></span
          >
          <b v-if="friendRequests > 0">{{ friendRequests }}</b>
        </button>
        <button type="button" @click="select('chat')">
          <MessageSquare :size="20" aria-hidden="true" />
          <span
            ><strong>{{ t('Chat', 'Trò chuyện') }}</strong
            ><small>{{ t('Open your conversations', 'Mở các cuộc hội thoại') }}</small></span
          >
          <b v-if="unreadMessages > 0">{{ unreadMessages }}</b>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.social-menu {
  position: relative;
  z-index: 60;
}

.social-menu__trigger {
  min-width: 2.75rem;
  padding-inline: 0.75rem !important;
  border-color: color-mix(in srgb, var(--color-accent) 14%, transparent) !important;
  background: color-mix(in srgb, var(--surface-4) 78%, transparent) !important;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text-foreground) 8%, transparent) !important;
}

.social-menu__icon {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
}

.social-menu__lock {
  position: absolute;
  right: -0.45rem;
  bottom: -0.4rem;
  box-sizing: border-box;
  width: 1rem;
  height: 1rem;
  padding: 0.125rem;
  color: var(--color-warning);
  border: 1px solid color-mix(in srgb, var(--color-warning) 42%, var(--color-border));
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
}

.social-menu__label {
  white-space: nowrap;
}

.social-menu__badge,
.social-menu__actions b {
  display: grid;
  min-width: 1.25rem;
  height: 1.25rem;
  padding-inline: 0.25rem;
  place-items: center;
  color: var(--text-foreground);
  font-size: var(--text-caption);
  border-radius: var(--radius-pill);
  background: var(--color-error);
}

.social-menu__backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.social-menu__popover {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 50;
  width: min(21rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid var(--color-fantasy-border-subtle);
  border-radius: 1rem;
  background: rgb(2 6 23 / 0.95);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(24px);
}

.social-menu__header,
.social-menu__header button,
.social-menu__locked-list > div,
.social-menu__actions button {
  display: flex;
  align-items: center;
}

.social-menu__header {
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-fantasy-border-subtle);
}

.social-menu__header strong {
  color: var(--color-fantasy-stone);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.social-menu__header p,
.social-menu__locked-list small,
.social-menu__actions small,
.social-menu__assurance {
  color: rgb(148 163 184);
  font-size: var(--text-caption);
}

.social-menu__header p {
  max-width: 17rem;
  margin-top: 0.25rem;
}

.social-menu__header button {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  justify-content: center;
  color: rgb(148 163 184);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.social-menu__header button:hover {
  color: rgb(255 255 255);
  background: rgb(255 255 255 / 0.1);
}

.social-menu__locked-list,
.social-menu__actions {
  display: grid;
  gap: 0.5rem;
  margin-block: 0.75rem;
}

.social-menu__locked-list > div,
.social-menu__actions button {
  min-height: 3.5rem;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-fantasy-border-subtle);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.04);
  transition: all 0.2s ease;
}

.social-menu__locked-list > div > span,
.social-menu__actions button > span {
  display: grid;
  min-width: 0;
  flex: 1;
}

.social-menu__actions button strong {
  color: rgb(241 245 249);
}

.social-menu__locked-list svg:last-child {
  color: var(--color-warning);
}

.social-menu__actions button {
  width: 100%;
  color: rgb(226 232 240);
  text-align: left;
}

.social-menu__actions button:hover,
.social-menu__actions button:focus-visible {
  color: rgb(255 255 255);
  background: rgb(255 255 255 / 0.1);
  border-color: rgba(251, 191, 36, 0.4);
  outline: none;
}

.social-menu__assurance {
  margin-top: 0.5rem;
  text-align: center;
}

@media (max-width: 72rem) {
  .social-menu__trigger {
    width: 2.75rem;
    padding: 0 !important;
  }

  .social-menu__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .social-menu__badge {
    position: absolute;
    top: -0.35rem;
    right: -0.35rem;
  }
}

@media (max-width: 30rem) {
  .social-menu__popover {
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
  }
}
</style>
