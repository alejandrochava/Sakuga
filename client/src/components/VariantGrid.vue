<script setup>
import { ref } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select', 'download']);

const selectedIndex = ref(0);

function selectImage(index) {
  selectedIndex.value = index;
  emit('select', props.images[index]);
}

function downloadImage(image) {
  const link = document.createElement('a');
  link.href = image.imageUrl;
  link.download = `sakuga-${image.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAll() {
  props.images.forEach(img => downloadImage(img));
}
</script>

<template>
  <div v-if="images.length > 0" class="space-y-4">
    <!-- Main Preview -->
    <div class="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
      <img
        :src="images[selectedIndex]?.imageUrl"
        :alt="images[selectedIndex]?.prompt"
        class="w-full h-full object-contain"
      />
      <div class="absolute bottom-3 right-3 flex gap-2">
        <button
          @click="downloadImage(images[selectedIndex])"
          class="px-3 py-1.5 bg-gray-900/80 hover:bg-gray-900 rounded-lg text-sm text-white transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>

    <!-- Thumbnails -->
    <div v-if="images.length > 1" class="flex gap-2">
      <button
        v-for="(image, index) in images"
        :key="image.id"
        @click="selectImage(index)"
        class="relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors"
        :class="selectedIndex === index ? 'border-primary-500' : 'border-transparent hover:border-gray-600'"
      >
        <img
          :src="image.imageUrl"
          :alt="image.prompt"
          class="w-full h-full object-cover"
        />
        <div
          v-if="selectedIndex === index"
          class="absolute inset-0 bg-primary-500/20"
        ></div>
      </button>
    </div>

    <!-- Actions -->
    <div v-if="images.length > 1" class="flex justify-end">
      <button
        @click="downloadAll"
        class="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Download all variants
      </button>
    </div>
  </div>
</template>
