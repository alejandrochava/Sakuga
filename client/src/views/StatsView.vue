<script setup>
import { ref, onMounted } from 'vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const stats = ref(null);
const isLoading = ref(true);
const error = ref(null);

async function fetchStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Failed to fetch stats');
    stats.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function getProviderColor(provider) {
  const colors = {
    openai: 'bg-green-500',
    stability: 'bg-purple-500',
    replicate: 'bg-blue-500',
    gemini: 'bg-yellow-500',
    ideogram: 'bg-pink-500',
    fal: 'bg-cyan-500',
    together: 'bg-orange-500',
    bfl: 'bg-indigo-500',
    a1111: 'bg-red-500'
  };
  return colors[provider] || 'bg-gray-500';
}

onMounted(fetchStats);
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-text-primary mb-6">Usage Stats</h1>

    <div v-if="isLoading" class="py-16">
      <LoadingSpinner size="lg" text="Loading stats..." />
    </div>

    <div v-else-if="error" class="p-4 bg-red-500/10 rounded-neu-sm shadow-neu-inset-sm">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <div v-else-if="stats" class="space-y-6">
      <!-- Overview Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-4">
          <p class="text-sm text-text-muted">Total Generations</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats.totalGenerations }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-text-muted">Total Cost</p>
          <p class="text-2xl font-bold text-accent mt-1">${{ stats.totalCost.toFixed(2) }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-text-muted">Last 7 Days</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats.last7Days }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-text-muted">Last 30 Days</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats.last30Days }}</p>
        </div>
      </div>

      <!-- By Provider -->
      <div class="card p-5">
        <h2 class="text-lg font-semibold text-text-primary mb-4">By Provider</h2>
        <div class="space-y-3">
          <div
            v-for="(data, provider) in stats.byProvider"
            :key="provider"
            class="flex items-center gap-3"
          >
            <div
              class="w-3 h-3 rounded-full"
              :class="getProviderColor(provider)"
            ></div>
            <span class="text-text-secondary capitalize flex-1">{{ provider }}</span>
            <span class="text-text-muted">{{ data.count }} generations</span>
            <span class="text-accent">${{ data.cost.toFixed(2) }}</span>
          </div>
          <div v-if="Object.keys(stats.byProvider).length === 0" class="text-text-muted text-sm">
            No data yet
          </div>
        </div>
      </div>

      <!-- By Type -->
      <div class="card p-5">
        <h2 class="text-lg font-semibold text-text-primary mb-4">By Type</h2>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="(count, type) in stats.byType"
            :key="type"
            class="px-4 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm"
          >
            <span class="text-text-secondary text-sm capitalize">{{ type }}</span>
            <span class="text-text-primary font-medium ml-2">{{ count }}</span>
          </div>
          <div v-if="Object.keys(stats.byType).length === 0" class="text-text-muted text-sm">
            No data yet
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
