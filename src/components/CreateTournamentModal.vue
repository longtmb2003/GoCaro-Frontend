<script setup lang="ts">
import { ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', name: string, maxPlayers: number): void
}>()

const name = ref('')
const maxPlayers = ref(4)

const PLAYERS_OPTIONS = [4, 8, 16]

function submit() {
  if (name.value.trim() === '') {
    return
  }
  emit('submit', name.value.trim(), maxPlayers.value)
}
</script>

<template>
  <BaseModal title="Create Tournament" size="sm" @close="emit('close')">
    <form @submit.prevent="submit" class="gap-4 flex flex-col pt-4">
      <BaseInput
        v-model="name"
        name="tournamentName"
        label="Tournament Name"
        placeholder="e.g. Weekly Open"
        required
        autofocus
      />

      <div class="gap-2 flex flex-col">
        <span class="text-body text-foreground-muted font-medium">Max Players</span>
        <div class="gap-2 flex flex-wrap">
          <BaseButton
            v-for="option in PLAYERS_OPTIONS"
            :key="option"
            type="button"
            size="sm"
            :variant="maxPlayers === option ? 'primary' : 'secondary'"
            @click="maxPlayers = option"
          >
            {{ option }}
          </BaseButton>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <BaseButton type="button" variant="ghost" @click="emit('close')">Cancel</BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="name.trim() === ''">Create</BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
