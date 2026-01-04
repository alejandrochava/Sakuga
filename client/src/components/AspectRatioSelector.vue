<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '1:1'
  }
});

const emit = defineEmits(['update:modelValue']);

const ratios = [
  { value: '1:1', label: '1:1', width: 24, height: 24 },
  { value: '16:9', label: '16:9', width: 32, height: 18 },
  { value: '9:16', label: '9:16', width: 18, height: 32 },
  { value: '4:3', label: '4:3', width: 28, height: 21 },
  { value: '3:4', label: '3:4', width: 21, height: 28 }
];

function selectRatio(value) {
  emit('update:modelValue', value);
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="ratio in ratios"
      :key="ratio.value"
      @click="selectRatio(ratio.value)"
      class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
      :class="modelValue === ratio.value
        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
        : 'border-gray-700 text-gray-400 hover:border-gray-600'"
    >
      <div
        class="border border-current flex-shrink-0"
        :style="{ width: ratio.width + 'px', height: ratio.height + 'px' }"
      ></div>
      <span class="text-sm">{{ ratio.label }}</span>
    </button>
  </div>
</template>
