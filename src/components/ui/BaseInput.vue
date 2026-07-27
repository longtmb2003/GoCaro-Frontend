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
    placeholder?: string
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
    labelHidden: false,
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
        :name="name"
        :type="computedType"
        :value="modelValue"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :placeholder="placeholder"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? errorId : undefined"
        class="border-border bg-glass-light text-foreground placeholder:text-foreground-disabled focus-visible:border-accent px-4 text-body duration-fast h-12 w-full rounded-button border backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60"
        :class="[hasError ? 'border-error' : '', type === 'password' ? 'pr-10' : '']"
        @input="handleInput"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="text-foreground-muted hover:text-foreground duration-fast absolute top-1/2 right-3 -translate-y-1/2 p-1 transition"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <span v-if="!showPassword">👁️</span>
        <span v-else class="relative inline-block">
          👁️
          <span class="absolute inset-0 flex items-center justify-center">
            <span class="bg-foreground h-px w-full origin-center rotate-45 transform" />
          </span>
        </span>
      </button>
    </div>
    <p v-if="hasError" :id="errorId" class="text-error text-small" role="alert">{{ error }}</p>
  </div>
</template>
