<script setup lang="ts">
import { computed, useId, ref } from 'vue'

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
  }>(),
  {
    type: 'text',
    autocomplete: 'off',
    error: '',
    required: false,
    disabled: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

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

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1.5">
    <label :for="inputId" class="text-foreground block text-sm font-medium">{{ label }}</label>
    <div class="relative">
      <input
        :id="inputId"
        :name="name"
        :type="computedType"
        :value="modelValue"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? errorId : undefined"
        class="border-border-subtle bg-background text-foreground focus-visible:border-primary-400 w-full rounded-md border px-4 h-12 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        :class="[hasError ? 'border-danger-500' : '', type === 'password' ? 'pr-10' : '']"
        @input="handleInput"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors p-1"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <span v-if="!showPassword">👁️</span>
        <span v-else class="relative inline-block">
          👁️
          <span class="absolute inset-0 flex items-center justify-center">
            <span class="w-full h-[1.5px] bg-foreground rotate-45 transform origin-center shadow-sm"></span>
          </span>
        </span>
      </button>
    </div>
    <p v-if="hasError" :id="errorId" class="text-danger-400 text-sm" role="alert">{{ error }}</p>
  </div>
</template>
