<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  placeholderClass: {
    type: String,
    default: ''
  }
});

const imageRef = ref(null);
const isLoaded = ref(false);
const isVisible = ref(false);
const hasError = ref(false);

let observer = null;

function onLoad() {
  isLoaded.value = true;
}

function onError() {
  hasError.value = true;
  isLoaded.value = true;
}

onMounted(() => {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true;
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (imageRef.value) {
      observer.observe(imageRef.value);
    }
  } else {
    // Fallback for browsers without IntersectionObserver
    isVisible.value = true;
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <div ref="imageRef" class="relative w-full h-full">
    <!-- Skeleton placeholder -->
    <div
      v-if="!isLoaded"
      class="absolute inset-0 skeleton"
      :class="placeholderClass"
    />

    <!-- Error state -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-neu-inset text-text-muted"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>

    <!-- Actual image -->
    <img
      v-if="isVisible && !hasError"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="{ 'opacity-0': !isLoaded, 'opacity-100': isLoaded }"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>
