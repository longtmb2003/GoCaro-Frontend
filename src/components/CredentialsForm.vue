<script setup lang="ts">
import { ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import type { Credentials } from '@/types/auth'
import { useAppLanguage } from '@/composables/useAppLanguage'

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
const { errorText, t } = useAppLanguage()

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
    usernameError.value = t('Username must be 3-20 characters.', 'Tên đăng nhập phải có từ 3 đến 20 ký tự.')
  } else if (!USERNAME_PATTERN.test(name)) {
    usernameError.value = t('Username may only contain letters and numbers.', 'Tên đăng nhập chỉ được chứa chữ cái và số.')
  }

  if (password.value.length < PASSWORD_MIN) {
    passwordError.value = t('Password must be at least 8 characters.', 'Mật khẩu phải có ít nhất 8 ký tự.')
  } else if (password.value.length > PASSWORD_MAX) {
    passwordError.value = t('Password must be at most 72 characters.', 'Mật khẩu không được vượt quá 72 ký tự.')
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
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <BaseInput
      v-model="username"
      name="username"
      :label="t('Username', 'Tên đăng nhập')"
      autocomplete="username"
      :error="usernameError"
      :disabled="loading"
      required
    />
    <BaseInput
      v-model="password"
      name="password"
      type="password"
      :label="t('Password', 'Mật khẩu')"
      :autocomplete="passwordAutocomplete"
      :error="passwordError"
      :disabled="loading"
      required
    />
    <p v-if="serverError" class="text-danger-400 text-sm" role="alert">{{ errorText(serverError) }}</p>
    <BaseButton type="submit" variant="primary" size="lg" class="w-full" :loading="loading">
      {{ loading && submitLabel === 'Sign in' ? t('Signing in...', 'Đang đăng nhập...') : submitLabel }}
    </BaseButton>
  </form>
</template>
