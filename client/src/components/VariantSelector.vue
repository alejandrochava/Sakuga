<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  max: {
    type: Number,
    default: 4
  }
});

const emit = defineEmits(['update:modelValue']);

function setCount(count) {
  emit('update:modelValue', count);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-400">Variants:</span>
    <div class="flex gap-1">
      <button
        v-for="n in max"
        :key="n"
        @click="setCount(n)"
        class="w-8 h-8 rounded flex items-center justify-center text-sm transition-colors"
        :class="modelValue === n
          ? 'bg-primary-500 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
      >
        {{ n }}
      </button>
    </div>
  </div>
</template>
