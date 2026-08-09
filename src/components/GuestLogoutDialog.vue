<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const emit = defineEmits<{ save: []; confirm: []; cancel: [] }>()
const { t } = useAppLanguage()
</script>

<template>
  <BaseModal
    :title="t('Log out as a guest?', 'Đăng xuất tài khoản khách?')"
    aria-describedby="guest-logout-description"
    @close="emit('cancel')"
  >
    <p id="guest-logout-description" class="text-foreground-muted text-body">
      {{
        t(
          'A guest account has no username or password, so there is no way back into this one. Your rating and match history are gone for good.',
          'Tài khoản khách không có tên đăng nhập hoặc mật khẩu nên bạn sẽ không thể quay lại. Điểm xếp hạng và lịch sử trận sẽ bị mất vĩnh viễn.',
        )
      }}
    </p>

    <template #footer>
      <div class="space-y-3">
        <BaseButton class="w-full" @click="emit('save')">{{ t('Save progress first', 'Lưu tiến trình trước') }}</BaseButton>
        <BaseButton variant="danger" class="w-full" @click="emit('confirm')">
          {{ t('Log out anyway', 'Vẫn đăng xuất') }}
        </BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="emit('cancel')">{{ t('Cancel', 'Hủy') }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
