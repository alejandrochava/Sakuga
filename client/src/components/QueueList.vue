<script setup>
import { ref } from 'vue';
import { useToast } from '../composables/useToast';
import EmptyState from './EmptyState.vue';

const toast = useToast();

defineProps({
  jobs: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['cancel', 'retry', 'refresh']);

const retryingId = ref(null);

function formatDate(dateString) {
  return new Date(dateString).toLocaleTimeString();
}

function getStatusBadgeClass(status) {
  const classes = {
    pending: 'badge-pending',
    processing: 'badge-processing',
    completed: 'badge-completed',
    failed: 'badge-failed'
  };
  return classes[status] || 'badge-pending';
}

async function retryJob(job) {
  retryingId.value = job.id;
  try {
    const response = await fetch(`/api/queue/${job.id}/retry`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to retry');
    toast.success('Job requeued!');
    emit('refresh');
  } catch (err) {
    toast.error(err.message);
  } finally {
    retryingId.value = null;
  }
}
</script>

<template>
  <EmptyState
    v-if="jobs.length === 0"
    icon="clock"
    title="Queue is empty"
    description="Jobs you queue will appear here. Start generating to see them in action."
  />

  <div v-else class="space-y-3">
    <div
      v-for="job in jobs"
      :key="job.id"
      class="p-4 bg-neu-surface rounded-neu-sm shadow-neu-raised-sm"
    >
      <div class="flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="text-sm text-text-primary truncate">{{ job.prompt }}</p>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="text-xs text-text-muted">{{ job.provider }}</span>
            <span class="text-xs text-text-muted">{{ formatDate(job.createdAt) }}</span>
            <span v-if="job.count > 1" class="text-xs text-text-muted">{{ job.count }} variants</span>
            <span v-if="job.retryCount" class="text-xs text-yellow-400">Retry #{{ job.retryCount }}</span>
          </div>
        </div>

        <span :class="getStatusBadgeClass(job.status)">
          <span v-if="job.status === 'processing'" class="w-2 h-2 bg-current rounded-full animate-pulse"></span>
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

        <button
          v-if="job.status === 'failed'"
          @click="retryJob(job)"
          :disabled="retryingId === job.id"
          class="p-2 text-text-muted hover:text-accent transition-colors disabled:opacity-50"
          title="Retry"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': retryingId === job.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Error message for failed jobs -->
      <div v-if="job.status === 'failed' && job.error" class="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
        {{ job.error }}
      </div>
    </div>
  </div>
</template>
