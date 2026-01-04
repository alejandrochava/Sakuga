<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import QueueList from '../components/QueueList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const queue = ref([]);
const isLoading = ref(true);
const error = ref(null);
let pollInterval = null;

async function fetchQueue() {
  try {
    const response = await fetch('/api/queue');
    if (!response.ok) throw new Error('Failed to fetch queue');
    queue.value = await response.json();
    error.value = null;
  } catch (err) {
    error.value = err.message;
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

    <div v-if="isLoading" class="py-16">
      <LoadingSpinner size="lg" text="Loading queue..." />
    </div>

    <div v-else-if="error" class="p-4 bg-red-500/10 rounded-neu-sm shadow-neu-inset-sm">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <QueueList
      v-else
      :jobs="queue"
      @cancel="cancelJob"
    />
  </div>
</template>
