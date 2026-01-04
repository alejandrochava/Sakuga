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
    pending: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400'
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}
</script>

<template>
  <div v-if="jobs.length === 0" class="text-center py-8 text-gray-500">
    <p>No jobs in queue</p>
    <p class="text-sm mt-1">Add prompts to generate them in the background</p>
  </div>

  <div v-else class="space-y-2">
    <div
      v-for="job in jobs"
      :key="job.id"
      class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg"
    >
      <div class="flex-1 min-w-0">
        <p class="text-sm text-white truncate">{{ job.prompt }}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-gray-500">{{ job.provider }}</span>
          <span class="text-xs text-gray-600">{{ formatDate(job.createdAt) }}</span>
          <span v-if="job.count > 1" class="text-xs text-gray-500">{{ job.count }} variants</span>
        </div>
      </div>

      <span
        class="px-2 py-0.5 rounded text-xs"
        :class="getStatusColor(job.status)"
      >
        {{ job.status }}
      </span>

      <button
        v-if="job.status === 'pending'"
        @click="emit('cancel', job.id)"
        class="p-1 text-gray-500 hover:text-red-400 transition-colors"
        title="Cancel"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
