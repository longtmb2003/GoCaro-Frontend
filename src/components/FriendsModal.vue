<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Search, UserPlus, Users, Swords, Check, MessageSquare } from 'lucide-vue-next'
import BaseButton from './ui/BaseButton.vue'
import BaseAvatar from './ui/BaseAvatar.vue'
import BaseBadge from './ui/BaseBadge.vue'
import BaseInput from './ui/BaseInput.vue'
import GlassCard from './ui/GlassCard.vue'
import { useSocialStore } from '@/stores/social'
import { useChatStore } from '@/stores/chat'
import { searchUsers, type UserSearch } from '@/api/user'
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '@/api/friend'
import { useToast } from '@/composables/useToast'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openChat', friendId: string): void
}>()

const social = useSocialStore()
const chatStore = useChatStore()
const toast = useToast()

const activeTab = ref<'friends' | 'requests' | 'search'>('friends')

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

async function sendRequest(id: string) {
  try {
    await sendFriendRequest(id)
    toast.addToast('Sent friend request!', 'success')
  } catch (e) {
    console.error(e)
  }
}

async function issueChallenge(friendId: string, friendName: string) {
  try {
    // Joining the queue happens on `challenge_accepted` (see stores/social.ts).
    // Queueing here would leave us in the public casual queue for the whole
    // invitation window, where a stranger can take the match first.
    await social.issueChallenge(friendId, friendName)
    emit('close')
  } catch (e: any) {
    toast.addToast(e?.message || 'Failed to send challenge', 'error')
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

async function unfriend(id: string) {
  try {
    await removeFriend(id)
    await social.fetchInitialData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  if (social.isConnected) {
    social.fetchInitialData()
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
      class="bg-background/80 absolute inset-0 backdrop-blur-sm"
      @click="emit('close')"
    ></div>

    <!-- Modal -->
    <div class="bg-surface ring-border-strong relative w-full max-w-md rounded-lg shadow-2xl ring-1 flex flex-col max-h-[80vh]">
      <!-- Header -->
      <div class="border-border-subtle flex items-center justify-between border-b p-4">
        <h2 class="text-h4 text-foreground flex items-center gap-2">
          <Users :size="24" />
          Friends
        </h2>
        <button
          class="text-foreground-muted hover:text-foreground hover:bg-surface-sunken rounded-md p-1 transition-colors"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-border-subtle flex border-b p-2">
        <button
          class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'friends' ? 'bg-surface-sunken text-foreground' : 'text-foreground-muted hover:text-foreground'"
          @click="activeTab = 'friends'"
        >
          Friends ({{ social.friends.length }})
        </button>
        <button
          class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'requests' ? 'bg-surface-sunken text-foreground' : 'text-foreground-muted hover:text-foreground'"
          @click="activeTab = 'requests'"
        >
          Requests ({{ social.incomingRequests.length }})
        </button>
        <button
          class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'search' ? 'bg-surface-sunken text-foreground' : 'text-foreground-muted hover:text-foreground'"
          @click="activeTab = 'search'"
        >
          Search
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <!-- Friends List -->
        <div v-if="activeTab === 'friends'" class="flex flex-col gap-3">
          <p v-if="social.friends.length === 0" class="text-center text-foreground-muted py-8">
            You don't have any friends yet.
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
              <BaseButton variant="secondary" size="sm" class="px-2" title="Chat" @click="openChat(friend.user.id)">
                <MessageSquare :size="16" />
              </BaseButton>
              <!-- Invite to challenge (casual) -->
              <BaseButton variant="primary" size="sm" class="px-2" title="Challenge" @click="issueChallenge(friend.user.id, friend.user.display_name)">
                <Swords :size="16" />
              </BaseButton>
              <BaseButton variant="danger" size="sm" class="px-2" title="Unfriend" @click="unfriend(friend.friendship_id)">
                <X :size="16" />
              </BaseButton>
            </div>
          </GlassCard>
        </div>

        <!-- Requests List -->
        <div v-if="activeTab === 'requests'" class="flex flex-col gap-3">
          <p v-if="social.incomingRequests.length === 0" class="text-center text-foreground-muted py-8">
            No incoming friend requests.
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
              <BaseButton variant="success" size="sm" class="px-2" title="Accept" @click="acceptReq(req.friendship_id)">
                <Check :size="16" />
              </BaseButton>
              <BaseButton variant="danger" size="sm" class="px-2" title="Decline" @click="declineReq(req.friendship_id)">
                <X :size="16" />
              </BaseButton>
            </div>
          </GlassCard>
        </div>

        <!-- Search -->
        <div v-if="activeTab === 'search'" class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <BaseInput v-model="searchQuery" name="search_user" label="Search User" placeholder="Search username..." class="flex-1" @keydown.enter="handleSearch" />
            <BaseButton variant="primary" :loading="isSearching" @click="handleSearch">
              <Search :size="18" />
            </BaseButton>
          </div>
          
          <div class="flex flex-col gap-3 mt-2">
            <p v-if="searchResults.length === 0 && !isSearching" class="text-center text-foreground-muted py-4">
              Enter a username to search.
            </p>
            <GlassCard v-for="user in searchResults" :key="user.id" as="div" variant="nested" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <BaseAvatar :name="user.display_name" size="sm" />
                <div>
                  <p class="font-semibold text-foreground">{{ user.display_name }}</p>
                  <p class="text-caption text-foreground-muted">Elo: {{ user.elo }}</p>
                </div>
              </div>
              <BaseButton variant="secondary" size="sm" class="px-2" title="Add Friend" @click="sendRequest(user.id)">
                <UserPlus :size="16" />
              </BaseButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
