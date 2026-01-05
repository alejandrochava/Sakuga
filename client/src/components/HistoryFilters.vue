<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  providers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['filter']);

const searchQuery = ref('');
const selectedType = ref('');
const selectedProvider = ref('');
const sortBy = ref('newest');

const types = [
  { value: '', label: 'All Types' },
  { value: 'generate', label: 'Generate' },
  { value: 'edit', label: 'Edit' },
  { value: 'image-to-image', label: 'Transform' },
  { value: 'inpaint', label: 'Inpaint' },
  { value: 'upscale', label: 'Upscale' }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'cost-high', label: 'Cost (High to Low)' },
  { value: 'cost-low', label: 'Cost (Low to High)' }
];

const providerOptions = computed(() => [
  { value: '', label: 'All Providers' },
  ...props.providers.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))
]);

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedType.value || selectedProvider.value || sortBy.value !== 'newest';
});

function applyFilters() {
  emit('filter', {
    search: searchQuery.value,
    type: selectedType.value,
    provider: selectedProvider.value,
    sort: sortBy.value
  });
}

function clearFilters() {
  searchQuery.value = '';
  selectedType.value = '';
  selectedProvider.value = '';
  sortBy.value = 'newest';
  applyFilters();
}

// Emit on any change
function handleChange() {
  applyFilters();
}
</script>

<template>
  <div class="space-y-3">
    <!-- Search -->
    <div class="relative">
      <input
        v-model="searchQuery"
        @input="handleChange"
        type="text"
        placeholder="Search prompts..."
        class="input pl-10"
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <!-- Filter Row -->
    <div class="flex flex-wrap gap-2">
      <!-- Type Filter -->
      <select
        v-model="selectedType"
        @change="handleChange"
        class="px-3 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        <option v-for="type in types" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>

      <!-- Provider Filter -->
      <select
        v-model="selectedProvider"
        @change="handleChange"
        class="px-3 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        <option v-for="provider in providerOptions" :key="provider.value" :value="provider.value">
          {{ provider.label }}
        </option>
      </select>

      <!-- Sort -->
      <select
        v-model="sortBy"
        @change="handleChange"
        class="px-3 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <!-- Clear Filters -->
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="px-3 py-2 text-sm text-text-muted hover:text-accent transition-colors"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>
