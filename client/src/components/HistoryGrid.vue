<script setup>
import { ref } from 'vue';
import { useToast } from '../composables/useToast';
import { downloadImage } from '../utils/download';
import LazyImage from './LazyImage.vue';

const toast = useToast();

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  favorites: {
    type: Set,
    default: () => new Set()
  },
  selectedIds: {
    type: Set,
    default: () => new Set()
  },
  selectionMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete', 'select', 'favorite', 'use-prompt', 'open-lightbox']);

const deletingId = ref(null);

async function copyPrompt(prompt) {
  try {
    await navigator.clipboard.writeText(prompt);
    toast.success('Prompt copied!');
  } catch {
    toast.error('Failed to copy');
  }
}

function usePrompt(item) {
  emit('use-prompt', item.prompt);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTypeLabel(type) {
  const labels = {
    'generate': 'Generate',
    'edit': 'Edit',
    'image-to-image': 'Transform',
    'inpaint': 'Inpaint',
    'upscale': 'Upscale'
  };
  return labels[type] || type;
}

function getTypeBadgeClass(type) {
  const classes = {
    'generate': 'badge-generate',
    'edit': 'badge-edit',
    'image-to-image': 'badge-edit',
    'inpaint': 'badge-inpaint',
    'upscale': 'badge-upscale'
  };
  return classes[type] || 'badge-generate';
}

async function handleDelete(id) {
  deletingId.value = id;
  emit('delete', id);
}

function handleDownload(item) {
  downloadImage(item.imageUrl, `sakuga-${item.id}.png`);
}

function handleCardClick(item) {
  if (props.selectionMode) {
    emit('select', item.id);
  } else {
    emit('open-lightbox', item);
  }
}

function isFavorite(id) {
  return props.favorites.has(id);
}

function isSelected(id) {
  return props.selectedIds.has(id);
}
</script>

<template>
  <div v-if="items.length === 0" class="text-center py-16">
    <svg class="w-16 h-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <p class="text-text-secondary">No generations yet</p>
    <p class="text-text-muted text-sm mt-1">Your generated images will appear here</p>
  </div>

  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="card overflow-hidden group hover-lift relative grid-item-animate"
      :class="{
        'ring-2 ring-accent shadow-accent-glow-sm': isSelected(item.id),
        'cursor-pointer': true
      }"
      :style="{ animationDelay: `${Math.min(index * 50, 500)}ms` }"
      @click="handleCardClick(item)"
    >
      <!-- Selection Checkbox -->
      <div
        v-if="selectionMode"
        class="absolute top-2 right-2 z-10"
        @click.stop="emit('select', item.id)"
      >
        <div
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          :class="isSelected(item.id)
            ? 'bg-accent border-accent'
            : 'bg-neu-surface/80 border-text-muted'"
        >
          <svg
            v-if="isSelected(item.id)"
            class="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <!-- Favorite Button -->
      <button
        v-if="!selectionMode"
        @click.stop="emit('favorite', item.id)"
        class="absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all"
        :class="isFavorite(item.id)
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-neu-surface/80 text-text-muted opacity-0 group-hover:opacity-100'"
        :title="isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'"
      >
        <svg
          class="w-5 h-5"
          :fill="isFavorite(item.id) ? 'currentColor' : 'none'"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>

      <div class="relative aspect-square">
        <LazyImage
          :src="item.imageUrl"
          :alt="item.prompt"
        />

        <!-- Action overlay (only when not in selection mode) -->
        <div
          v-if="!selectionMode"
          class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          @click.stop
        >
          <button
            @click="copyPrompt(item.prompt)"
            class="w-10 h-10 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-full flex items-center justify-center text-text-primary transition-all duration-200 hover:scale-105"
            title="Copy prompt"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            @click="usePrompt(item)"
            class="w-10 h-10 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-full flex items-center justify-center text-text-primary transition-all duration-200 hover:scale-105"
            title="Use this prompt"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            @click="handleDownload(item)"
            class="w-10 h-10 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-full flex items-center justify-center text-text-primary transition-all duration-200 hover:scale-105"
            title="Download"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            @click="handleDelete(item.id)"
            :disabled="deletingId === item.id"
            class="w-10 h-10 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 transition-all disabled:opacity-50 hover:scale-105"
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- Type Badge -->
        <span
          class="absolute top-2 left-2"
          :class="getTypeBadgeClass(item.type)"
        >
          {{ getTypeLabel(item.type) }}
        </span>
      </div>

      <div class="p-3">
        <p class="text-sm text-text-secondary line-clamp-2 mb-2">{{ item.prompt }}</p>
        <div class="flex items-center gap-2 text-xs text-text-muted flex-wrap">
          <span>{{ formatDate(item.createdAt) }}</span>
          <span v-if="item.provider" class="capitalize">{{ item.provider }}</span>
          <span v-if="item.cost" class="text-accent">${{ item.cost.toFixed(3) }}</span>
          <span v-if="isFavorite(item.id)" class="text-yellow-400">Favorite</span>
        </div>
      </div>
    </div>
  </div>
</template>
