<script setup>
import { ref } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['delete', 'select']);

const deletingId = ref(null);

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

function getTypeColor(type) {
  const colors = {
    'generate': 'text-accent',
    'edit': 'text-blue-400',
    'image-to-image': 'text-purple-400',
    'inpaint': 'text-orange-400',
    'upscale': 'text-cyan-400'
  };
  return colors[type] || 'text-text-muted';
}

async function handleDelete(id) {
  deletingId.value = id;
  emit('delete', id);
}

function downloadImage(item) {
  const link = document.createElement('a');
  link.href = item.imageUrl;
  link.download = `sakuga-${item.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
      v-for="item in items"
      :key="item.id"
      class="card overflow-hidden group hover-lift"
    >
      <div class="relative aspect-square">
        <img
          :src="item.imageUrl"
          :alt="item.prompt"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            @click="downloadImage(item)"
            class="w-11 h-11 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-full flex items-center justify-center text-text-primary transition-all duration-200 hover:scale-105"
            title="Download"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            @click="handleDelete(item.id)"
            :disabled="deletingId === item.id"
            class="w-11 h-11 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 transition-all disabled:opacity-50 hover:scale-105"
            title="Delete"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <span
          class="absolute top-2 left-2 px-2.5 py-1 bg-neu-surface/90 shadow-neu-raised-sm rounded-full text-xs font-medium"
          :class="getTypeColor(item.type)"
        >
          {{ getTypeLabel(item.type) }}
        </span>
      </div>
      <div class="p-3">
        <p class="text-sm text-text-secondary line-clamp-2 mb-2">{{ item.prompt }}</p>
        <div class="flex items-center gap-2 text-xs text-text-muted">
          <span>{{ formatDate(item.createdAt) }}</span>
          <span v-if="item.provider" class="capitalize">{{ item.provider }}</span>
          <span v-if="item.cost" class="text-accent">${{ item.cost.toFixed(3) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
