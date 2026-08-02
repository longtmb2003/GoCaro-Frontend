<script setup lang="ts">
import { computed, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { ProfileUpdate } from '@/types/auth'

const props = withDefaults(
  defineProps<{
    /** The name currently saved, or '' when the player has never set one. */
    fullName: string
    /** The handle the player falls back to when they clear their full name. */
    username: string
    /** False while the weekly cooldown from the last rename is still running. */
    canChangeName?: boolean
    /** When the next rename is allowed. Only meaningful when canChangeName is false. */
    nameAvailableAt?: Date | null
    loading?: boolean
    serverError?: string
  }>(),
  {
    canChangeName: true,
    nameAvailableAt: null,
    loading: false,
    serverError: '',
  }
)

const emit = defineEmits<{ submit: [update: ProfileUpdate]; close: [] }>()

// Mirrors models.MaxFullNameLength and the users_full_name_not_blank check.
const FULL_NAME_MAX = 50

const fullNameDraft = ref(props.fullName)
const phoneDraft = ref('')
const fullNameError = ref('')
const phoneError = ref('')

/** Matches the backend's normalisation, so what is validated is what is sent. */
function normalisePhone(value: string): string {
  return value.trim().replace(/[\s.()-]/g, '')
}

const nameAvailableLabel = computed(() => {
  const at = props.nameAvailableAt
  return at === null ? '' : at.toLocaleDateString(undefined, { dateStyle: 'medium' })
})

/**
 * What the player will be called once this saves. Shown live because clearing
 * the name silently drops them back to their handle, and that is worth seeing
 * before it costs a week.
 */
const resultingName = computed(() => fullNameDraft.value.trim() || props.username)

const nameIsChanging = computed(() => fullNameDraft.value.trim() !== props.fullName)

function validate(): boolean {
  fullNameError.value = ''
  phoneError.value = ''

  const name = fullNameDraft.value.trim()
  if (name !== '') {
    // Code points, not grapheme clusters: the server counts Go runes, and the
    // two have to agree or the client accepts a name the server rejects.
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    if ([...name].length > FULL_NAME_MAX) {
      fullNameError.value = `Full name must be at most ${String(FULL_NAME_MAX)} characters.`
    } else if (!/\p{L}/u.test(name)) {
      fullNameError.value = 'Full name must contain at least one letter.'
    }
  }

  const phone = normalisePhone(phoneDraft.value)
  if (phone !== '' && !/^\+?[0-9]{6,19}$/.test(phone)) {
    phoneError.value = 'Enter 6 to 19 digits, optionally starting with +.'
  }

  return fullNameError.value === '' && phoneError.value === ''
}

function handleSubmit(): void {
  if (props.loading || !validate()) {
    return
  }

  // Only changed fields are sent. Sending the name unchanged would be harmless
  // on the server but pointless, and sending the phone unchanged would be too.
  const update: ProfileUpdate = {}
  const name = fullNameDraft.value.trim()
  const phone = normalisePhone(phoneDraft.value)

  if (name !== props.fullName) {
    update.full_name = name
  }
  if (phone !== '') {
    update.phone = phone
  }

  if (update.full_name === undefined && update.phone === undefined) {
    emit('close')
    return
  }
  emit('submit', update)
}

/**
 * Closing while the request is in flight would hide a change that is still
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
    title="Edit profile"
    :dismissible="!loading"
    initial-focus="input"
    aria-describedby="edit-profile-description"
    @close="requestClose"
  >
    <p id="edit-profile-description" class="text-foreground-muted text-body mb-4">
      Your full name is what other players see. Your username and rating do not change.
    </p>

    <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
      <BaseInput
        v-model="fullNameDraft"
        name="full_name"
        label="Full name"
        autocomplete="name"
        placeholder="Leave empty to use your username"
        :maxlength="FULL_NAME_MAX"
        :error="fullNameError"
        :disabled="loading || !canChangeName"
      />

      <p v-if="!canChangeName" class="text-foreground-muted text-small">
        You changed your name recently. You can change it again on
        {{ nameAvailableLabel }}.
      </p>
      <p v-else-if="nameIsChanging" class="text-foreground-muted text-small">
        You will appear as <span class="text-foreground font-medium">{{ resultingName }}</span
        >. After saving you cannot change it again for 7 days.
      </p>

      <BaseInput
        v-model="phoneDraft"
        name="phone"
        type="tel"
        label="Phone"
        autocomplete="tel"
        placeholder="Leave empty to keep current"
        :maxlength="20"
        :error="phoneError"
        :disabled="loading"
      />
      <p class="text-foreground-muted text-small">Phone is hidden for security. Leave empty to keep existing.</p>

      <p v-if="serverError" class="text-error text-small" role="alert">{{ serverError }}</p>

      <BaseButton type="submit" variant="primary" size="lg" class="w-full" :loading="loading">
        Save changes
      </BaseButton>
    </form>

    <template #footer>
      <BaseButton variant="secondary" class="w-full" :disabled="loading" @click="requestClose">
        Cancel
      </BaseButton>
    </template>
  </BaseModal>
</template>
