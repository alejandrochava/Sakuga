<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: [File, null],
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const isDragging = ref(false);
const previewUrl = ref(null);

function handleDragOver(event) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(event) {
  event.preventDefault();
  isDragging.value = false;

  const files = event.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    setFile(files[0]);
  }
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    setFile(files[0]);
  }
}

function setFile(file) {
  emit('update:modelValue', file);

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = URL.createObjectURL(file);
}

function clearFile() {
  emit('update:modelValue', null);
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
}
</script>

<template>
  <div>
    <!-- Preview -->
    <div v-if="previewUrl" class="relative">
      <img
        :src="previewUrl"
        alt="Selected image"
        class="w-full h-48 object-contain bg-gray-800 rounded-lg"
      />
      <button
        @click="clearFile"
        class="absolute top-2 right-2 w-8 h-8 bg-gray-900/80 hover:bg-gray-900 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Dropzone -->
    <div
      v-else
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
      :class="isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 hover:border-gray-600'"
    >
      <input
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <svg class="w-10 h-10 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-400 text-sm">
        Drop an image here or <span class="text-primary-400">browse</span>
      </p>
      <p class="text-gray-600 text-xs mt-1">PNG, JPG, WebP up to 10MB</p>
    </div>
  </div>
</template>
