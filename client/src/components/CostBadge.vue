<script setup>
defineProps({
  cost: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'sm' // 'sm' or 'lg'
  }
});
</script>

<template>
  <span
    v-if="cost > 0"
    class="inline-flex items-center gap-1 bg-neu-surface shadow-neu-raised-sm text-accent rounded-full"
    :class="size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'"
  >
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    ${{ cost.toFixed(3) }}
  </span>
</template>
