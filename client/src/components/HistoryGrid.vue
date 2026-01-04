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
    'generate': 'Text to Image',
    'edit': 'Edit',
    'image-to-image': 'Transform'
  };
  return labels[type] || type;
}

function getTypeColor(type) {
  const colors = {
    'generate': 'bg-green-500/20 text-green-400',
    'edit': 'bg-blue-500/20 text-blue-400',
    'image-to-image': 'bg-purple-500/20 text-purple-400'
  };
  return colors[type] || 'bg-gray-500/20 text-gray-400';
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
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <p class="text-gray-500">No generations yet</p>
    <p class="text-gray-600 text-sm mt-1">Your generated images will appear here</p>
  </div>

  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="card overflow-hidden group"
    >
      <div class="relative aspect-square">
        <img
          :src="item.imageUrl"
          :alt="item.prompt"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            @click="downloadImage(item)"
            class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            title="Download"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            @click="handleDelete(item.id)"
            :disabled="deletingId === item.id"
            class="w-10 h-10 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <span
          class="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
          :class="getTypeColor(item.type)"
        >
          {{ getTypeLabel(item.type) }}
        </span>
      </div>
      <div class="p-3">
        <p class="text-sm text-gray-300 line-clamp-2 mb-2">{{ item.prompt }}</p>
        <p class="text-xs text-gray-500">{{ formatDate(item.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>
