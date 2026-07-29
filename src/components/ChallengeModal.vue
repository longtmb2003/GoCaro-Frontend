<script setup lang="ts">
import { computed } from 'vue'
import { Check, X, Swords } from 'lucide-vue-next'
import BaseButton from './ui/BaseButton.vue'
import BaseAvatar from './ui/BaseAvatar.vue'
import GlassCard from './ui/GlassCard.vue'
import { useSocialStore } from '@/stores/social'
import { acceptChallenge, declineChallenge } from '@/api/friend'
import { useRouter } from 'vue-router'
import { useSocketStore } from '@/stores/socket'

// This component handles the globally active challenge (if any)
const social = useSocialStore()
const socket = useSocketStore()
const router = useRouter()

// Simplest approach: just show a modal if there is a pending challenge from social store
// Wait, social store doesn't track incomingChallenges state yet. I'll add it here for demonstration or update social store.
</script>
<template>
  <div v-if="false"></div>
</template>
