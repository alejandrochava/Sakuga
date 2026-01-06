<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SkeletonLoader from '../components/SkeletonLoader.vue';
import EmptyState from '../components/EmptyState.vue';
import HistoryGrid from '../components/HistoryGrid.vue';
import ErrorState from '../components/ErrorState.vue';
import { useToast } from '../composables/useToast';

const router = useRouter();
const toast = useToast();

const collections = ref([]);
const selectedCollection = ref(null);
const collectionItems = ref([]);
const isLoading = ref(true);
const isLoadingItems = ref(false);
const error = ref(null);

// Create/Edit modal
const showModal = ref(false);
const editingCollection = ref(null);
const formName = ref('');
const formDescription = ref('');

onMounted(fetchCollections);

async function fetchCollections() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/collections');

    if (!response.ok) {
      if (response.status === 404) {
        // Route not found - likely server needs restart
        throw new Error('API not available. Please restart the server.');
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    collections.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Collections fetch error:', err);
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      error.value = 'Cannot connect to server. Is it running?';
    } else {
      error.value = err.message || 'Failed to load collections';
    }
  } finally {
    isLoading.value = false;
  }
}

function retryFetch() {
  fetchCollections();
}

async function selectCollection(collection) {
  selectedCollection.value = collection;
  isLoadingItems.value = true;

  try {
    const response = await fetch(`/api/collections/${collection.id}/items`);
    if (!response.ok) throw new Error('Failed to fetch items');
    collectionItems.value = await response.json();
  } catch (err) {
    toast.error(err.message);
  } finally {
    isLoadingItems.value = false;
  }
}

function openCreateModal() {
  editingCollection.value = null;
  formName.value = '';
  formDescription.value = '';
  showModal.value = true;
}

function openEditModal(collection) {
  editingCollection.value = collection;
  formName.value = collection.name;
  formDescription.value = collection.description || '';
  showModal.value = true;
}

async function saveCollection() {
  if (!formName.value.trim()) {
    toast.error('Name is required');
    return;
  }

  try {
    if (editingCollection.value) {
      // Update
      const response = await fetch(`/api/collections/${editingCollection.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.value,
          description: formDescription.value
        })
      });
      if (!response.ok) throw new Error('Failed to update');
      toast.success('Collection updated');
    } else {
      // Create
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.value,
          description: formDescription.value
        })
      });
      if (!response.ok) throw new Error('Failed to create');
      toast.success('Collection created');
    }

    showModal.value = false;
    fetchCollections();
  } catch (err) {
    toast.error(err.message);
  }
}

async function deleteCollection(collection) {
  if (!confirm(`Delete "${collection.name}"? Images won't be deleted.`)) return;

  try {
    const response = await fetch(`/api/collections/${collection.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete');

    toast.success('Collection deleted');

    if (selectedCollection.value?.id === collection.id) {
      selectedCollection.value = null;
      collectionItems.value = [];
    }

    fetchCollections();
  } catch (err) {
    toast.error(err.message);
  }
}

async function removeFromCollection(historyId) {
  try {
    const response = await fetch(`/api/history/${historyId}/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId: null })
    });
    if (!response.ok) throw new Error('Failed to remove');

    collectionItems.value = collectionItems.value.filter(i => i.id !== historyId);
    toast.success('Removed from collection');

    // Update item count
    const col = collections.value.find(c => c.id === selectedCollection.value.id);
    if (col) col.itemCount--;
  } catch (err) {
    toast.error(err.message);
  }
}

function goBack() {
  selectedCollection.value = null;
  collectionItems.value = [];
}

function handleUsePrompt(prompt) {
  router.push({ name: 'generate', query: { prompt } });
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button
          v-if="selectedCollection"
          @click="goBack"
          class="p-2 bg-neu-surface shadow-neu-raised-sm rounded-neu-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-text-primary">
            {{ selectedCollection ? selectedCollection.name : 'Collections' }}
          </h1>
          <p v-if="selectedCollection?.description" class="text-text-muted text-sm mt-0.5">
            {{ selectedCollection.description }}
          </p>
        </div>
      </div>

      <button
        v-if="!selectedCollection"
        @click="openCreateModal"
        class="btn btn-primary"
      >
        New Collection
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SkeletonLoader type="card" :count="6" />
    </div>

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      title="Unable to Load Collections"
      :message="error"
      @retry="retryFetch"
    />

    <!-- Collection Items View -->
    <div v-else-if="selectedCollection">
      <div v-if="isLoadingItems" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <SkeletonLoader type="image" :count="8" />
      </div>
      <EmptyState
        v-else-if="collectionItems.length === 0"
        icon="folder"
        title="This collection is empty"
        description="Add images from your history to organize them here."
        action-label="Go to History"
        @action="router.push({ name: 'history' })"
      />
      <HistoryGrid
        v-else
        :items="collectionItems"
        @delete="removeFromCollection"
        @use-prompt="handleUsePrompt"
      />
    </div>

    <!-- Collections Grid -->
    <div v-else>
      <EmptyState
        v-if="collections.length === 0"
        icon="folder"
        title="No collections yet"
        description="Create a collection to organize your generated images."
        action-label="Create Collection"
        @action="openCreateModal"
      />

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(collection, index) in collections"
          :key="collection.id"
          class="card p-5 cursor-pointer hover-lift group grid-item-animate"
          :style="{ animationDelay: `${index * 80}ms` }"
          @click="selectCollection(collection)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                {{ collection.name }}
              </h3>
              <p v-if="collection.description" class="text-sm text-text-muted mt-1 line-clamp-2">
                {{ collection.description }}
              </p>
            </div>
            <div class="flex items-center gap-1 ml-2" @click.stop>
              <button
                @click="openEditModal(collection)"
                class="p-1.5 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all"
                title="Edit"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                @click="deleteCollection(collection)"
                class="p-1.5 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-4 mt-4 text-sm text-text-muted">
            <span>{{ collection.itemCount || 0 }} images</span>
            <span>{{ new Date(collection.createdAt).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60" @click="showModal = false"></div>
          <div class="relative w-full max-w-md bg-neu-surface rounded-neu shadow-neu-raised-lg p-6">
            <h2 class="text-lg font-semibold text-text-primary mb-4">
              {{ editingCollection ? 'Edit Collection' : 'New Collection' }}
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-2">Name</label>
                <input
                  v-model="formName"
                  type="text"
                  class="input"
                  placeholder="My Collection"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-text-secondary mb-2">Description (optional)</label>
                <textarea
                  v-model="formDescription"
                  class="input resize-none"
                  rows="3"
                  placeholder="A brief description..."
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button @click="showModal = false" class="btn btn-secondary">
                Cancel
              </button>
              <button @click="saveCollection" class="btn btn-primary">
                {{ editingCollection ? 'Save' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
