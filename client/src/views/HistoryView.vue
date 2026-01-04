<script setup>
import { ref, onMounted } from 'vue';
import HistoryGrid from '../components/HistoryGrid.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const history = ref([]);
const isLoading = ref(true);
const error = ref(null);

async function fetchHistory() {
  try {
    const response = await fetch('/api/history');
    if (!response.ok) throw new Error('Failed to fetch history');
    history.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function handleDelete(id) {
  try {
    const response = await fetch(`/api/history/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete');

    history.value = history.value.filter(item => item.id !== id);
  } catch (err) {
    console.error('Delete error:', err);
  }
}

onMounted(() => {
  fetchHistory();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-text-primary">History</h1>
      <p v-if="history.length > 0" class="text-text-muted text-sm">
        {{ history.length }} generation{{ history.length !== 1 ? 's' : '' }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-16">
      <LoadingSpinner size="lg" text="Loading history..." />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-4 bg-red-500/10 rounded-neu-sm shadow-neu-inset-sm">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- History Grid -->
    <HistoryGrid
      v-else
      :items="history"
      @delete="handleDelete"
    />
  </div>
</template>
