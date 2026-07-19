<script setup lang="ts">
import { ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import type { Credentials } from '@/types/auth'

const props = withDefaults(
  defineProps<{
    submitLabel: string
    loading?: boolean
    serverError?: string
    passwordAutocomplete?: string
  }>(),
  {
    loading: false,
    serverError: '',
    passwordAutocomplete: 'current-password',
  },
)

const emit = defineEmits<{ submit: [credentials: Credentials] }>()

const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')

const USERNAME_PATTERN = /^[a-zA-Z0-9]+$/
const USERNAME_MIN = 3
const USERNAME_MAX = 20
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

function validate(): boolean {
  usernameError.value = ''
  passwordError.value = ''

  const name = username.value.trim()
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
    usernameError.value = 'Username must be 3-20 characters.'
  } else if (!USERNAME_PATTERN.test(name)) {
    usernameError.value = 'Username may only contain letters and numbers.'
  }

  if (password.value.length < PASSWORD_MIN) {
    passwordError.value = 'Password must be at least 8 characters.'
  } else if (password.value.length > PASSWORD_MAX) {
    passwordError.value = 'Password must be at most 72 characters.'
  }

  return usernameError.value === '' && passwordError.value === ''
}

function handleSubmit(): void {
  if (props.loading || !validate()) {
    return
  }
  emit('submit', { username: username.value.trim(), password: password.value })
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
    <BaseInput
      v-model="username"
      name="username"
      label="Username"
      autocomplete="username"
      :error="usernameError"
      :disabled="loading"
      required
    />
    <BaseInput
      v-model="password"
      name="password"
      type="password"
      label="Password"
      :autocomplete="passwordAutocomplete"
      :error="passwordError"
      :disabled="loading"
      required
    />
    <p v-if="serverError" class="text-danger-400 text-sm" role="alert">{{ serverError }}</p>
    <BaseButton type="submit" variant="primary" class="w-full" :loading="loading">
      {{ submitLabel }}
    </BaseButton>
  </form>
</template>
