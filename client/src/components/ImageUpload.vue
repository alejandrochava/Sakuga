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
    <div v-if="previewUrl" class="relative neu-raised p-2">
      <img
        :src="previewUrl"
        alt="Selected image"
        class="w-full h-48 object-contain bg-neu-inset rounded-neu-sm"
      />
      <button
        @click="clearFile"
        class="absolute top-4 right-4 w-8 h-8 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-200"
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
      class="relative rounded-neu p-8 text-center transition-all duration-200 cursor-pointer"
      :class="isDragging
        ? 'bg-neu-inset shadow-neu-inset shadow-accent-glow-sm'
        : 'bg-neu-surface shadow-neu-raised hover:shadow-neu-raised-lg'"
    >
      <input
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <svg class="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-text-secondary text-sm">
        Drop an image here or <span class="text-accent">browse</span>
      </p>
      <p class="text-text-muted text-xs mt-1">PNG, JPG, WebP up to 10MB</p>
    </div>
  </div>
</template>
