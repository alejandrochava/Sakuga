<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import HistoryGrid from '../components/HistoryGrid.vue';
import HistoryFilters from '../components/HistoryFilters.vue';
import ImageLightbox from '../components/ImageLightbox.vue';
import SkeletonLoader from '../components/SkeletonLoader.vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorState from '../components/ErrorState.vue';
import { useToast } from '../composables/useToast';
import { downloadImage } from '../utils/download';

const router = useRouter();
const toast = useToast();

const history = ref([]);
const isLoading = ref(true);
const error = ref(null);

// Filtering
const filters = ref({
  search: '',
  type: '',
  provider: '',
  sort: 'newest'
});

// Batch selection
const selectedIds = ref(new Set());
const isSelectionMode = ref(false);

// Lightbox
const lightboxVisible = ref(false);
const lightboxIndex = ref(0);

// Favorites stored in localStorage
const favorites = ref(new Set());
const FAVORITES_KEY = 'sakuga-favorites';

// Get unique providers from history
const providers = computed(() => {
  const providerSet = new Set(history.value.map(item => item.provider).filter(Boolean));
  return Array.from(providerSet);
});

// Filtered and sorted history
const filteredHistory = computed(() => {
  let items = [...history.value];

  // Search filter
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    items = items.filter(item =>
      item.prompt?.toLowerCase().includes(searchLower)
    );
  }

  // Type filter
  if (filters.value.type) {
    items = items.filter(item => item.type === filters.value.type);
  }

  // Provider filter
  if (filters.value.provider) {
    items = items.filter(item => item.provider === filters.value.provider);
  }

  // Sort
  switch (filters.value.sort) {
    case 'oldest':
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'cost-high':
      items.sort((a, b) => (b.cost || 0) - (a.cost || 0));
      break;
    case 'cost-low':
      items.sort((a, b) => (a.cost || 0) - (b.cost || 0));
      break;
    default: // newest
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return items;
});

// Computed for selection
const selectedCount = computed(() => selectedIds.value.size);
const allSelected = computed(() =>
  filteredHistory.value.length > 0 && selectedIds.value.size === filteredHistory.value.length
);

onMounted(() => {
  loadFavorites();
  fetchHistory();
});

function loadFavorites() {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      favorites.value = new Set(JSON.parse(saved));
    }
  } catch {
    favorites.value = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites.value]));
}

async function fetchHistory() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/history');

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    history.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('History fetch error:', err);
    error.value = err.message || 'Failed to load history';
  } finally {
    isLoading.value = false;
  }
}

function handleFilter(newFilters) {
  filters.value = newFilters;
}

async function handleDelete(id) {
  try {
    const response = await fetch(`/api/history/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete');

    history.value = history.value.filter(item => item.id !== id);
    selectedIds.value.delete(id);
    favorites.value.delete(id);
    saveFavorites();
    toast.success('Image deleted');
  } catch (err) {
    toast.error('Delete failed');
  }
}

function handleSelect(id) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  selectedIds.value = new Set(selectedIds.value); // Trigger reactivity
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(filteredHistory.value.map(item => item.id));
  }
}

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  if (!isSelectionMode.value) {
    selectedIds.value = new Set();
  }
}

function handleFavorite(id) {
  if (favorites.value.has(id)) {
    favorites.value.delete(id);
  } else {
    favorites.value.add(id);
  }
  favorites.value = new Set(favorites.value); // Trigger reactivity
  saveFavorites();
}

function openLightbox(item) {
  const index = filteredHistory.value.findIndex(i => i.id === item.id);
  if (index !== -1) {
    lightboxIndex.value = index;
    lightboxVisible.value = true;
  }
}

function handleLightboxDownload(image) {
  downloadImage(image.imageUrl, `sakuga-${image.id}.png`);
}

async function deleteSelected() {
  if (selectedIds.value.size === 0) return;

  const count = selectedIds.value.size;
  const ids = [...selectedIds.value];

  for (const id of ids) {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      history.value = history.value.filter(item => item.id !== id);
      favorites.value.delete(id);
    } catch {
      // Continue with others
    }
  }

  selectedIds.value = new Set();
  saveFavorites();
  toast.success(`Deleted ${count} image${count !== 1 ? 's' : ''}`);
}

function downloadSelected() {
  const selected = filteredHistory.value.filter(item => selectedIds.value.has(item.id));
  selected.forEach(item => downloadImage(item.imageUrl, `sakuga-${item.id}.png`));
  toast.success(`Downloaded ${selected.length} image${selected.length !== 1 ? 's' : ''}`);
}

function handleUsePrompt(prompt) {
  router.push({ name: 'generate', query: { prompt } });
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">History</h1>
        <p v-if="history.length > 0" class="text-text-muted text-sm mt-1">
          {{ filteredHistory.length }} of {{ history.length }} generation{{ history.length !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Selection Mode Toggle -->
      <div class="flex items-center gap-3">
        <button
          @click="toggleSelectionMode"
          class="px-3 py-2 text-sm rounded-neu-sm transition-all"
          :class="isSelectionMode
            ? 'bg-accent/20 text-accent shadow-neu-inset-sm'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary'"
        >
          {{ isSelectionMode ? 'Cancel' : 'Select' }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6">
      <HistoryFilters
        :providers="providers"
        @filter="handleFilter"
      />
    </div>

    <!-- Batch Actions Bar -->
    <Transition name="slide-up">
      <div
        v-if="isSelectionMode && selectedCount > 0"
        class="mb-4 p-3 bg-neu-surface rounded-neu-sm shadow-neu-raised-sm flex items-center justify-between flex-wrap gap-3"
      >
        <div class="flex items-center gap-3">
          <button
            @click="toggleSelectAll"
            class="px-3 py-1.5 text-sm bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-text-secondary hover:text-text-primary"
          >
            {{ allSelected ? 'Deselect All' : 'Select All' }}
          </button>
          <span class="text-sm text-text-muted">
            {{ selectedCount }} selected
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="downloadSelected"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-text-secondary hover:text-accent"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            @click="deleteSelected"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/20 rounded-neu-sm text-red-400 hover:bg-red-500/30"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </Transition>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <SkeletonLoader type="image" :count="12" />
    </div>

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      title="Unable to Load History"
      :message="error"
      @retry="fetchHistory"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="history.length === 0"
      icon="image"
      title="No generations yet"
      description="Your generated images will appear here. Start creating to build your history."
      action-label="Start Creating"
      @action="router.push({ name: 'generate' })"
    />

    <!-- No Results -->
    <EmptyState
      v-else-if="filteredHistory.length === 0"
      icon="search"
      title="No results found"
      description="Try adjusting your filters or search query."
    />

    <!-- History Grid -->
    <HistoryGrid
      v-else
      :items="filteredHistory"
      :favorites="favorites"
      :selected-ids="selectedIds"
      :selection-mode="isSelectionMode"
      @delete="handleDelete"
      @select="handleSelect"
      @favorite="handleFavorite"
      @use-prompt="handleUsePrompt"
      @open-lightbox="openLightbox"
    />

    <!-- Lightbox -->
    <ImageLightbox
      :images="filteredHistory"
      :initial-index="lightboxIndex"
      :visible="lightboxVisible"
      @close="lightboxVisible = false"
      @download="handleLightboxDownload"
    />
  </div>
</template>
