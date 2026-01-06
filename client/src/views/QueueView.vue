<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import QueueList from '../components/QueueList.vue';
import SkeletonLoader from '../components/SkeletonLoader.vue';
import ErrorState from '../components/ErrorState.vue';

const queue = ref([]);
const isLoading = ref(true);
const error = ref(null);
let pollInterval = null;

async function fetchQueue() {
  try {
    const response = await fetch('/api/queue');

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    queue.value = Array.isArray(data) ? data : [];
    error.value = null;
  } catch (err) {
    console.error('Queue fetch error:', err);
    error.value = err.message || 'Failed to load queue';
  } finally {
    isLoading.value = false;
  }
}

async function cancelJob(id) {
  try {
    const response = await fetch(`/api/queue/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to cancel job');
    await fetchQueue();
  } catch (err) {
    console.error('Cancel error:', err);
  }
}

onMounted(() => {
  fetchQueue();
  // Poll for updates every 2 seconds
  pollInterval = setInterval(fetchQueue, 2000);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-text-primary">Queue</h1>
      <p v-if="queue.length > 0" class="text-text-muted text-sm">
        {{ queue.filter(j => j.status === 'pending').length }} pending
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <SkeletonLoader type="card" :count="4" class-name="!p-4 !space-y-2" />
    </div>

    <ErrorState
      v-else-if="error"
      title="Unable to Load Queue"
      :message="error"
      @retry="fetchQueue"
    />

    <QueueList
      v-else
      :jobs="queue"
      @cancel="cancelJob"
    />
  </div>
</template>
