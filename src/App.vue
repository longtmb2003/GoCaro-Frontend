<script setup lang="ts">
import { RouterView } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'

const auth = useAuthStore()
const social = useSocialStore()

watch(
  () => auth.token,
  (newToken) => {
    if (newToken && !auth.isGuest) {
      social.connect(newToken)
    } else {
      social.disconnect()
    }
  },
  { immediate: true }
)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>
