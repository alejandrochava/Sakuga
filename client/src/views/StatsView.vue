<script setup>
import { ref, computed, onMounted } from 'vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ErrorState from '../components/ErrorState.vue';

const stats = ref(null);
const isLoading = ref(true);
const error = ref(null);
const chartPeriod = ref('30'); // 7, 30, or 'all'

async function fetchStats() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/stats');

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error (${response.status})`);
    }

    stats.value = await response.json();
  } catch (err) {
    console.error('Stats fetch error:', err);
    error.value = err.message || 'Failed to load statistics';
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

const chartData = computed(() => {
  if (!stats.value?.recentCosts) return [];

  const data = [...stats.value.recentCosts].reverse();
  const limit = chartPeriod.value === 'all' ? data.length : parseInt(chartPeriod.value);

  return data.slice(-limit);
});

const maxCost = computed(() => {
  if (!chartData.value.length) return 0;
  return Math.max(...chartData.value.map(d => d.cost), 0.01);
});

const maxCount = computed(() => {
  if (!chartData.value.length) return 0;
  return Math.max(...chartData.value.map(d => d.count), 1);
});

const avgCostPerGeneration = computed(() => {
  if (!stats.value || stats.value.totalGenerations === 0) return 0;
  return stats.value.totalCost / stats.value.totalGenerations;
});

const providerBreakdown = computed(() => {
  if (!stats.value?.byProvider) return [];

  const total = Object.values(stats.value.byProvider).reduce((sum, p) => sum + p.count, 0);

  return Object.entries(stats.value.byProvider)
    .map(([name, data]) => ({
      name,
      count: data.count,
      cost: data.cost,
      percentage: total > 0 ? (data.count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
});

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

onMounted(fetchStats);
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-text-primary mb-6">Usage Stats</h1>

    <div v-if="isLoading" class="py-16">
      <LoadingSpinner size="lg" text="Loading stats..." />
    </div>

    <ErrorState
      v-else-if="error"
      title="Unable to Load Statistics"
      :message="error"
      @retry="fetchStats"
    />

    <div v-else-if="stats" class="space-y-6">
      <!-- Overview Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="card p-4">
          <p class="text-sm text-text-muted">Total Generations</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats.totalGenerations.toLocaleString() }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-text-muted">Total Cost</p>
          <p class="text-2xl font-bold text-accent mt-1">${{ stats.totalCost.toFixed(2) }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-text-muted">Avg Cost/Image</p>
          <p class="text-2xl font-bold text-text-primary mt-1">${{ avgCostPerGeneration.toFixed(4) }}</p>
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

      <!-- Activity Chart -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-text-primary">Daily Activity</h2>
          <div class="flex gap-1 bg-neu-inset rounded-neu-sm p-1">
            <button
              v-for="period in [{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: 'all', label: 'All' }]"
              :key="period.value"
              @click="chartPeriod = period.value"
              class="px-3 py-1 text-sm rounded-neu-sm transition-all"
              :class="chartPeriod === period.value
                ? 'bg-neu-surface shadow-neu-raised-sm text-accent'
                : 'text-text-muted hover:text-text-primary'"
            >
              {{ period.label }}
            </button>
          </div>
        </div>

        <!-- Bar Chart -->
        <div v-if="chartData.length > 0" class="space-y-4">
          <!-- Count bars -->
          <div>
            <p class="text-xs text-text-muted mb-2">Generations</p>
            <div class="flex items-end gap-1 h-24">
              <div
                v-for="day in chartData"
                :key="day.date"
                class="flex-1 min-w-0 group relative"
              >
                <div
                  class="w-full bg-accent/30 rounded-t transition-all hover:bg-accent/50"
                  :style="{ height: `${(day.count / maxCount) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }"
                >
                  <!-- Tooltip -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neu-surface rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-neu-raised-sm">
                    <p class="text-text-primary">{{ day.count }} images</p>
                    <p class="text-accent">${{ day.cost.toFixed(3) }}</p>
                    <p class="text-text-muted">{{ formatDate(day.date) }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-xs text-text-muted">{{ formatDate(chartData[0]?.date) }}</span>
              <span class="text-xs text-text-muted">{{ formatDate(chartData[chartData.length - 1]?.date) }}</span>
            </div>
          </div>

          <!-- Cost bars -->
          <div>
            <p class="text-xs text-text-muted mb-2">Cost ($)</p>
            <div class="flex items-end gap-1 h-16">
              <div
                v-for="day in chartData"
                :key="`cost-${day.date}`"
                class="flex-1 min-w-0"
              >
                <div
                  class="w-full bg-green-500/30 rounded-t transition-all hover:bg-green-500/50"
                  :style="{ height: `${(day.cost / maxCost) * 100}%`, minHeight: day.cost > 0 ? '2px' : '0' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-text-muted">
          No activity data yet
        </div>
      </div>

      <!-- Provider Breakdown -->
      <div class="card p-5">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Provider Breakdown</h2>

        <div v-if="providerBreakdown.length > 0" class="space-y-4">
          <!-- Provider bars -->
          <div v-for="provider in providerBreakdown" :key="provider.name" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :class="getProviderColor(provider.name)"></div>
                <span class="text-text-secondary capitalize">{{ provider.name }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-text-muted">{{ provider.count }} images</span>
                <span class="text-accent w-16 text-right">${{ provider.cost.toFixed(2) }}</span>
              </div>
            </div>
            <div class="h-2 bg-neu-inset rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getProviderColor(provider.name)"
                :style="{ width: `${provider.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
        <div v-else class="text-text-muted text-sm text-center py-4">
          No data yet
        </div>
      </div>

      <!-- By Type -->
      <div class="card p-5">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Generation Types</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div
            v-for="(count, type) in stats.byType"
            :key="type"
            class="p-3 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-center"
          >
            <p class="text-2xl font-bold text-text-primary">{{ count }}</p>
            <p class="text-xs text-text-muted capitalize mt-1">{{ type }}</p>
          </div>
          <div v-if="Object.keys(stats.byType).length === 0" class="col-span-full text-text-muted text-sm text-center py-4">
            No data yet
          </div>
        </div>
      </div>

      <!-- Cost Summary -->
      <div class="card p-5">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Cost Summary</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-3 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm">
            <p class="text-xs text-text-muted">Today</p>
            <p class="text-lg font-semibold text-accent mt-1">
              ${{ (chartData[chartData.length - 1]?.cost || 0).toFixed(3) }}
            </p>
          </div>
          <div class="p-3 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm">
            <p class="text-xs text-text-muted">This Week</p>
            <p class="text-lg font-semibold text-accent mt-1">
              ${{ chartData.slice(-7).reduce((sum, d) => sum + d.cost, 0).toFixed(2) }}
            </p>
          </div>
          <div class="p-3 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm">
            <p class="text-xs text-text-muted">This Month</p>
            <p class="text-lg font-semibold text-accent mt-1">
              ${{ chartData.slice(-30).reduce((sum, d) => sum + d.cost, 0).toFixed(2) }}
            </p>
          </div>
          <div class="p-3 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm">
            <p class="text-xs text-text-muted">All Time</p>
            <p class="text-lg font-semibold text-accent mt-1">
              ${{ stats.totalCost.toFixed(2) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
