<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const showTooltip = ref(false);

function toggle() {
  emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <div class="relative inline-flex items-center gap-2">
    <label class="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="toggle"
        class="sr-only"
      />
      <!-- Neumorphic Toggle -->
      <div
        class="w-12 h-6 rounded-full transition-all duration-200 flex items-center px-0.5"
        :class="modelValue
          ? 'bg-accent/20 shadow-accent-glow-sm'
          : 'bg-neu-inset shadow-neu-inset-sm'"
      >
        <div
          class="w-5 h-5 rounded-full transition-all duration-200"
          :class="modelValue
            ? 'bg-accent translate-x-6 shadow-accent-glow-sm'
            : 'bg-neu-elevated shadow-neu-raised-sm translate-x-0'"
        ></div>
      </div>
      <span class="text-sm text-text-secondary">Enhance prompt</span>
    </label>

    <!-- Tooltip trigger -->
    <button
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      class="w-5 h-5 rounded-full bg-neu-surface shadow-neu-raised-sm text-text-muted text-xs flex items-center justify-center hover:shadow-neu-raised hover:text-text-secondary transition-all duration-200"
    >
      ?
    </button>

    <!-- Tooltip -->
    <div
      v-show="showTooltip"
      class="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 w-64 p-4 bg-neu-surface rounded-neu-sm shadow-neu-raised-lg text-sm text-text-secondary"
    >
      <p class="font-medium text-text-primary mb-1">AI Prompt Enhancement</p>
      <p>Use AI to improve your prompt before generating. Adds details about style, lighting, and composition for better results.</p>
      <div class="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-neu-surface rotate-45"></div>
    </div>
  </div>
</template>
