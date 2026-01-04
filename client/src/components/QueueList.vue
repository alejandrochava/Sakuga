<script setup>
defineProps({
  jobs: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['cancel']);

function formatDate(dateString) {
  return new Date(dateString).toLocaleTimeString();
}

function getStatusColor(status) {
  const colors = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-accent',
    failed: 'text-red-400'
  };
  return colors[status] || 'text-text-muted';
}
</script>

<template>
  <div v-if="jobs.length === 0" class="text-center py-8 text-text-muted">
    <p>No jobs in queue</p>
    <p class="text-sm mt-1">Add prompts to generate them in the background</p>
  </div>

  <div v-else class="space-y-3">
    <div
      v-for="job in jobs"
      :key="job.id"
      class="flex items-center gap-4 p-4 bg-neu-surface rounded-neu-sm shadow-neu-raised-sm"
    >
      <div class="flex-1 min-w-0">
        <p class="text-sm text-text-primary truncate">{{ job.prompt }}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-text-muted">{{ job.provider }}</span>
          <span class="text-xs text-text-muted">{{ formatDate(job.createdAt) }}</span>
          <span v-if="job.count > 1" class="text-xs text-text-muted">{{ job.count }} variants</span>
        </div>
      </div>

      <span
        class="px-2.5 py-1 bg-neu-inset shadow-neu-inset-sm rounded-full text-xs font-medium"
        :class="getStatusColor(job.status)"
      >
        {{ job.status }}
      </span>

      <button
        v-if="job.status === 'pending'"
        @click="emit('cancel', job.id)"
        class="p-2 text-text-muted hover:text-red-400 transition-colors"
        title="Cancel"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
