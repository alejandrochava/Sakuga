<script setup>
defineProps({
  title: {
    type: String,
    default: 'Something went wrong'
  },
  message: {
    type: String,
    default: 'An error occurred while loading data'
  },
  showRetry: {
    type: Boolean,
    default: true
  }
});

defineEmits(['retry']);
</script>

<template>
  <div class="text-center py-16">
    <div class="inline-block p-6 bg-neu-surface rounded-neu shadow-neu-inset max-w-md">
      <svg class="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="text-lg font-semibold text-text-primary mb-2">{{ title }}</h3>
      <p class="text-text-muted text-sm mb-4">{{ message }}</p>
      <button v-if="showRetry" @click="$emit('retry')" class="btn btn-primary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>
