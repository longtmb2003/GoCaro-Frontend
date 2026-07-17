<script setup lang="ts">
import { computed, useId } from 'vue'

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

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1.5">
    <label :for="inputId" class="text-foreground block text-sm font-medium">{{ label }}</label>
    <input
      :id="inputId"
      :name="name"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? errorId : undefined"
      class="border-border-subtle bg-background text-foreground focus-visible:border-primary-400 w-full rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      :class="hasError ? 'border-danger-500' : ''"
      @input="handleInput"
    />
    <p v-if="hasError" :id="errorId" class="text-danger-400 text-sm" role="alert">{{ error }}</p>
  </div>
</template>
