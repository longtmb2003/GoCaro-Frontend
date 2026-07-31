<script setup lang="ts">
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import AppLayout from '@/layouts/AppLayout.vue'
</script>

<template>
  <AppLayout title="GoCaro">
    <section class="mx-auto max-w-md py-16 text-center">
      <p class="text-primary-400 text-5xl font-bold">404</p>
      <h2 class="text-foreground mt-4 text-xl font-semibold">Page not found</h2>
      <p class="text-foreground-muted mt-2 text-sm">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <RouterLink to="/">
        <BaseButton class="mt-6">Back to lobby</BaseButton>
      </RouterLink>
    </section>
  </AppLayout>
</template>
