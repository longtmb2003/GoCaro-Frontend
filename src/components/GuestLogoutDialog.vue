<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const emit = defineEmits<{ save: []; confirm: []; cancel: [] }>()
</script>

<template>
  <BaseModal
    title="Log out as a guest?"
    aria-describedby="guest-logout-description"
    @close="emit('cancel')"
  >
    <p id="guest-logout-description" class="text-foreground-muted text-body">
      A guest account has no username or password, so there is no way back into this one. Your
      rating and match history are gone for good.
    </p>

    <template #footer>
      <div class="space-y-3">
        <BaseButton class="w-full" @click="emit('save')">Save progress first</BaseButton>
        <BaseButton variant="danger" class="w-full" @click="emit('confirm')">
          Log out anyway
        </BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="emit('cancel')">Cancel</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
