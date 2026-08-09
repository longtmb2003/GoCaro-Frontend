<script setup lang="ts">
import { computed, useId, ref, useSlots } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    name: string
    type?: string
    autocomplete?: string
    error?: string
    required?: boolean
    disabled?: boolean
    placeholder?: string
    /**
     * Declared rather than left to fall through: the root here is the wrapper,
     * so an undeclared maxlength would land on the <div> and cap nothing.
     */
    maxlength?: number
    /** Keeps the label for screen readers when the field is visually obvious. */
    labelHidden?: boolean
  }>(),
  {
    type: 'text',
    autocomplete: 'off',
    error: '',
    required: false,
    disabled: false,
    placeholder: undefined,
    maxlength: undefined,
    labelHidden: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const slots = useSlots()
const { t } = useAppLanguage()

const inputId = useId()
const errorId = computed(() => `${inputId}-error`)
const hasError = computed(() => props.error !== '')

const showPassword = ref(false)
const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const inputRef = ref<HTMLInputElement | null>(null)

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function focus(): void {
  inputRef.value?.focus()
}

defineExpose({
  focus,
  inputRef,
})
</script>

<template>
  <!--
    Flex + gap rather than space-y: an sr-only label is absolutely positioned,
    so it drops out of flow instead of leaving a phantom gap above the field.
  -->
  <div class="gap-1 flex flex-col">
    <label
      :for="inputId"
      class="text-foreground text-small block font-medium"
      :class="labelHidden ? 'sr-only' : ''"
      >{{ label }}</label
    >
    <div class="relative">
      <input
        :id="inputId"
        ref="inputRef"
        :name="name"
        :type="computedType"
        :value="modelValue"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? errorId : undefined"
        class="border-border bg-glass-light text-foreground placeholder:text-foreground-disabled focus-visible:border-accent px-4 text-body duration-fast h-12 w-full rounded-button border backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60"
        :class="[
          hasError ? 'border-error' : '',
          type === 'password' ? 'pr-10' : '',
          slots.prefix ? 'pl-11' : '',
        ]"
        @input="handleInput"
      />
      <span
        v-if="slots.prefix"
        class="text-foreground-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
        aria-hidden="true"
      >
        <slot name="prefix" />
      </span>
      <button
        v-if="type === 'password'"
        type="button"
        class="text-foreground-muted hover:text-foreground duration-fast absolute top-1/2 right-3 -translate-y-1/2 p-1 transition"
        :aria-label="showPassword ? t('Hide password', 'Ẩn mật khẩu') : t('Show password', 'Hiện mật khẩu')"
        @click="showPassword = !showPassword"
      >
        <Eye v-if="!showPassword" :size="20" aria-hidden="true" />
        <EyeOff v-else :size="20" aria-hidden="true" />
      </button>
    </div>
    <p v-if="hasError" :id="errorId" class="text-error text-small" role="alert">{{ error }}</p>
  </div>
</template>
