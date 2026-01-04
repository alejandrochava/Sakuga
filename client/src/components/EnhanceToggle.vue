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
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="toggle"
        class="sr-only"
      />
      <div
        class="w-10 h-5 rounded-full transition-colors"
        :class="modelValue ? 'bg-primary-500' : 'bg-gray-700'"
      >
        <div
          class="w-4 h-4 mt-0.5 rounded-full bg-white transition-transform"
          :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
        ></div>
      </div>
      <span class="text-sm text-gray-300">Enhance prompt</span>
    </label>

    <!-- Tooltip trigger -->
    <button
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      class="w-4 h-4 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-600"
    >
      ?
    </button>

    <!-- Tooltip -->
    <div
      v-show="showTooltip"
      class="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-sm text-gray-300"
    >
      <p class="font-medium text-white mb-1">AI Prompt Enhancement</p>
      <p>Use AI to improve your prompt before generating. Adds details about style, lighting, and composition for better results.</p>
      <div class="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 border-l border-b border-gray-700 rotate-45"></div>
    </div>
  </div>
</template>
