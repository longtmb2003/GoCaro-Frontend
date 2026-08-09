<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Search, Users, Swords, Check, MessageSquare } from 'lucide-vue-next'
import BaseButton from './ui/BaseButton.vue'
import BaseAvatar from './ui/BaseAvatar.vue'
import BaseBadge from './ui/BaseBadge.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseModal from './ui/BaseModal.vue'
import GlassCard from './ui/GlassCard.vue'
import FantasySystemIcon from './ui/FantasySystemIcon.vue'
import FriendRequestButton from './FriendRequestButton.vue'
import { useSocialStore } from '@/stores/social'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { searchUsers, type UserSearch } from '@/api/user'
import { acceptFriendRequest, declineFriendRequest, removeFriend } from '@/api/friend'
import { useToast } from '@/composables/useToast'
import { useAppLanguage } from '@/composables/useAppLanguage'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openChat', friendId: string): void
}>()

const social = useSocialStore()
const chatStore = useChatStore()
const auth = useAuthStore()
const toast = useToast()
const { t } = useAppLanguage()

const activeTab = ref<'friends' | 'requests' | 'search'>('friends')

const friendToRemove = ref<string | null>(null)

// Search state
const searchQuery = ref('')
const searchResults = ref<UserSearch[]>([])
const isSearching = ref(false)

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    searchResults.value = await searchUsers(searchQuery.value)
  } catch (e) {
    console.error(e)
  } finally {
    isSearching.value = false
  }
}

async function issueChallenge(friendId: string, friendName: string) {
  try {
    // Joining the queue happens on `challenge_accepted` (see stores/social.ts).
    // Queueing here would leave us in the public casual queue for the whole
    // invitation window, where a stranger can take the match first.
    await social.issueChallenge(friendId, friendName)
    emit('close')
  } catch (error: unknown) {
    const fallback = t('Failed to send challenge', 'Không thể gửi lời thách đấu')
    toast.addToast(error instanceof Error ? error.message : fallback, 'error')
  }
}

async function acceptReq(id: string) {
  try {
    await acceptFriendRequest(id)
    await social.fetchInitialData()
  } catch (e) {
    console.error(e)
  }
}

async function declineReq(id: string) {
  try {
    await declineFriendRequest(id)
    await social.fetchInitialData()
  } catch (e) {
    console.error(e)
  }
}

function confirmUnfriend(id: string) {
  friendToRemove.value = id
}

async function executeUnfriend() {
  if (!friendToRemove.value) return
  try {
    await removeFriend(friendToRemove.value)
    await social.fetchInitialData()
  } catch (e) {
    console.error(e)
  } finally {
    friendToRemove.value = null
  }
}

onMounted(() => {
  if (social.isConnected) {
    void social.fetchInitialData()
  }
})

function openChat(id: string) {
  emit('openChat', id)
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="bg-slate-950/80 absolute inset-0 backdrop-blur-md"
      @click="emit('close')"
    ></div>

    <!-- Modal -->
    <div class="bg-slate-950/95 border border-[var(--color-fantasy-border-subtle)] shadow-2xl backdrop-blur-2xl relative w-full max-w-md rounded-2xl flex flex-col max-h-[80vh] overflow-hidden">
      <!-- Header -->
      <div class="border-b border-[var(--color-fantasy-border-subtle)] flex items-center justify-between p-4 bg-slate-900/40">
        <h2 class="text-lg font-serif font-bold text-[var(--color-fantasy-stone)] flex items-center gap-2 tracking-wide">
          <FantasySystemIcon><Users :size="22" class="text-amber-400" /></FantasySystemIcon>
          {{ t('Friends', 'Bạn bè') }}
        </h2>
        <button
          class="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          @click="emit('close')"
        >
          <FantasySystemIcon compact><X :size="18" /></FantasySystemIcon>
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-[var(--color-fantasy-border-subtle)] flex p-2 gap-1.5 bg-slate-900/20">
        <button
          class="flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all border"
          :class="activeTab === 'friends' ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'"
          @click="activeTab = 'friends'"
        >
          {{ t('Friends', 'Bạn bè') }} ({{ social.friends.length }})
        </button>
        <button
          class="flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all border"
          :class="activeTab === 'requests' ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'"
          @click="activeTab = 'requests'"
        >
          {{ t('Requests', 'Lời mời') }} ({{ social.incomingRequests.length }})
        </button>
        <button
          class="flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all border"
          :class="activeTab === 'search' ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'"
          @click="activeTab = 'search'"
        >
          {{ t('Search', 'Tìm kiếm') }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <!-- Friends List -->
        <div v-if="activeTab === 'friends'" class="flex flex-col gap-3">
          <p v-if="social.friends.length === 0" class="text-center text-foreground-muted py-8">
            {{ t("You don't have any friends yet.", 'Bạn chưa có người bạn nào.') }}
          </p>
          <GlassCard v-for="friend in social.friends" :key="friend.friendship_id" as="div" variant="nested" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <BaseAvatar :name="friend.user.display_name" size="sm" :online="friend.is_online" />
              <div>
                <p class="font-semibold text-foreground flex items-center gap-2">
                  {{ friend.user.display_name }}
                  <BaseBadge v-if="(chatStore.unreadCounts[friend.user.id] ?? 0) > 0" variant="danger">
                    {{ chatStore.unreadCounts[friend.user.id] }}
                  </BaseBadge>
                </p>
                <p class="text-caption text-foreground-muted">Elo: {{ friend.user.elo }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton variant="secondary" size="sm" class="px-2" :title="t('Chat', 'Trò chuyện')" @click="openChat(friend.user.id)">
                <FantasySystemIcon compact><MessageSquare :size="16" /></FantasySystemIcon>
              </BaseButton>
              <!-- Invite to challenge (casual) -->
              <BaseButton variant="primary" size="sm" class="px-2" :title="t('Challenge', 'Thách đấu')" @click="issueChallenge(friend.user.id, friend.user.display_name)">
                <FantasySystemIcon compact><Swords :size="16" /></FantasySystemIcon>
              </BaseButton>
              <BaseButton variant="danger" size="sm" class="px-2" :title="t('Unfriend', 'Hủy kết bạn')" @click="confirmUnfriend(friend.friendship_id)">
                <FantasySystemIcon compact><X :size="16" /></FantasySystemIcon>
              </BaseButton>
            </div>
          </GlassCard>
        </div>

        <!-- Requests List -->
        <div v-if="activeTab === 'requests'" class="flex flex-col gap-3">
          <p v-if="social.incomingRequests.length === 0" class="text-center text-foreground-muted py-8">
            {{ t('No incoming friend requests.', 'Không có lời mời kết bạn mới.') }}
          </p>
          <GlassCard v-for="req in social.incomingRequests" :key="req.friendship_id" as="div" variant="nested" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <BaseAvatar :name="req.user.display_name" size="sm" />
              <div>
                <p class="font-semibold text-foreground">{{ req.user.display_name }}</p>
                <p class="text-caption text-foreground-muted">Elo: {{ req.user.elo }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton variant="success" size="sm" class="px-2" :title="t('Accept', 'Chấp nhận')" @click="acceptReq(req.friendship_id)">
                <FantasySystemIcon compact><Check :size="16" /></FantasySystemIcon>
              </BaseButton>
              <BaseButton variant="danger" size="sm" class="px-2" :title="t('Decline', 'Từ chối')" @click="declineReq(req.friendship_id)">
                <FantasySystemIcon compact><X :size="16" /></FantasySystemIcon>
              </BaseButton>
            </div>
          </GlassCard>
        </div>

        <!-- Search -->
        <div v-if="activeTab === 'search'" class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <BaseInput v-model="searchQuery" name="search_user" :label="t('Search User', 'Tìm người chơi')" :placeholder="t('Search username...', 'Tìm theo tên đăng nhập...')" class="flex-1" @keydown.enter="handleSearch" />
            <BaseButton variant="primary" :loading="isSearching" @click="handleSearch">
              <FantasySystemIcon compact><Search :size="18" /></FantasySystemIcon>
            </BaseButton>
          </div>
          
          <div class="flex flex-col gap-3 mt-2">
            <p v-if="searchResults.length === 0 && !isSearching" class="text-center text-foreground-muted py-4">
              {{ t('Enter a username to search.', 'Nhập tên đăng nhập để tìm kiếm.') }}
            </p>
            <GlassCard v-for="user in searchResults" :key="user.id" as="div" variant="nested" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <BaseAvatar :name="user.display_name" size="sm" />
                <div>
                  <p class="font-semibold text-foreground">{{ user.display_name }}</p>
                  <p class="text-caption text-foreground-muted">Elo: {{ user.elo }}</p>
                </div>
              </div>
              <FriendRequestButton
                v-if="user.id !== auth.user?.id"
                :user-id="user.id"
                :display-name="user.display_name"
                compact
              />
            </GlassCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Unfriend Modal -->
    <BaseModal
      v-if="friendToRemove"
      :title="t('Remove Friend', 'Xóa bạn bè')"
      @close="friendToRemove = null"
    >
      <p class="text-foreground-muted mb-6">
        {{ t('Are you sure you want to remove this friend? You will no longer be able to chat or invite them directly.', 'Bạn có chắc muốn xóa người bạn này? Bạn sẽ không thể chat hoặc mời họ trực tiếp nữa.') }}
      </p>
      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" @click="friendToRemove = null">{{ t('Cancel', 'Hủy') }}</BaseButton>
        <BaseButton variant="danger" @click="executeUnfriend">{{ t('Remove', 'Xóa') }}</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
