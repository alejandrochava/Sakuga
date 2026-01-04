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
  <div class="flex items-center gap-3">
    <span class="text-sm text-text-secondary">Variants:</span>
    <div class="flex gap-1.5">
      <button
        v-for="n in max"
        :key="n"
        @click="setCount(n)"
        class="w-9 h-9 rounded-neu-sm flex items-center justify-center text-sm font-medium transition-all duration-200"
        :class="modelValue === n
          ? 'bg-neu-surface shadow-neu-inset-sm text-accent'
          : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:shadow-neu-raised hover:text-text-primary'"
      >
        {{ n }}
      </button>
    </div>
  </div>
</template>
