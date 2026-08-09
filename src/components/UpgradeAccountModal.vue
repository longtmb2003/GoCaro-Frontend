<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CredentialsForm from '@/components/CredentialsForm.vue'
import type { Credentials } from '@/types/auth'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    serverError?: string
  }>(),
  {
    loading: false,
    serverError: '',
  },
)

const emit = defineEmits<{ submit: [credentials: Credentials]; close: [] }>()
const { t } = useAppLanguage()

/**
 * Closing while the request is in flight would hide a rename that is still
 * going to land, so the dialog stays put until it settles either way.
 */
function requestClose(): void {
  if (props.loading) {
    return
  }
  emit('close')
}
</script>

<template>
  <BaseModal
    :title="t('Save your progress', 'Lưu tiến trình của bạn')"
    :dismissible="!loading"
    initial-focus="input"
    aria-describedby="upgrade-description"
    @close="requestClose"
  >
    <p id="upgrade-description" class="text-foreground-muted text-body mb-4">
      {{ t('Pick a username and password. Your rating and match history stay exactly as they are.', 'Chọn tên đăng nhập và mật khẩu. Điểm xếp hạng cùng lịch sử trận của bạn sẽ được giữ nguyên.') }}
    </p>

    <CredentialsForm
      :submit-label="t('Save account', 'Lưu tài khoản')"
      password-autocomplete="new-password"
      :loading="loading"
      :server-error="serverError"
      @submit="emit('submit', $event)"
    />

    <template #footer>
      <BaseButton variant="secondary" class="w-full" :disabled="loading" @click="requestClose">
        {{ t('Cancel', 'Hủy') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
