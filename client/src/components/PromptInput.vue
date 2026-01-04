<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Describe the image you want to generate...'
  },
  maxLength: {
    type: Number,
    default: 2000
  }
});

const emit = defineEmits(['update:modelValue']);

const charCount = computed(() => props.modelValue.length);
const isNearLimit = computed(() => charCount.value > props.maxLength * 0.9);

function updateValue(event) {
  emit('update:modelValue', event.target.value);
}
</script>

<template>
  <div class="relative">
    <textarea
      :value="modelValue"
      @input="updateValue"
      :placeholder="placeholder"
      :maxlength="maxLength"
      rows="4"
      class="input resize-none pr-16"
    ></textarea>
    <div
      class="absolute bottom-3 right-3 text-xs"
      :class="isNearLimit ? 'text-yellow-500' : 'text-text-muted'"
    >
      {{ charCount }}/{{ maxLength }}
    </div>
  </div>
</template>
