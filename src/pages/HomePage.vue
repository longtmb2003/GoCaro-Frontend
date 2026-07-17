<script setup lang="ts">
import { useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout(): Promise<void> {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <AppLayout title="GoCaro">
    <section class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
      <h2 class="text-foreground text-2xl font-semibold tracking-tight">
        Signed in as {{ auth.user?.username }}
      </h2>
      <p class="text-foreground-muted mt-2 text-sm">
        Authentication is working end-to-end. The lobby arrives in the next phase.
      </p>
      <BaseButton variant="danger" class="mt-6" @click="handleLogout">Log out</BaseButton>
    </section>
  </AppLayout>
</template>
