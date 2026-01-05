<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'download']);

const currentIndex = ref(props.initialIndex);
const scale = ref(1);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const position = ref({ x: 0, y: 0 });

const currentImage = computed(() => props.images[currentIndex.value] || null);
const hasMultiple = computed(() => props.images.length > 1);

watch(() => props.initialIndex, (val) => {
  currentIndex.value = val;
  resetView();
});

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
    resetView();
  } else {
    document.body.style.overflow = '';
  }
});

function resetView() {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
}

function close() {
  emit('close');
}

function next() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    resetView();
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    resetView();
  }
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.5, 5);
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.5, 0.5);
  if (scale.value <= 1) {
    position.value = { x: 0, y: 0 };
  }
}

function resetZoom() {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
}

function handleWheel(e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
}

function startDrag(e) {
  if (scale.value > 1) {
    isDragging.value = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.value = {
      x: clientX - position.value.x,
      y: clientY - position.value.y
    };
  }
}

function onDrag(e) {
  if (isDragging.value && scale.value > 1) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    position.value = {
      x: clientX - dragStart.value.x,
      y: clientY - dragStart.value.y
    };
  }
}

function endDrag() {
  isDragging.value = false;
}

function download() {
  if (currentImage.value) {
    emit('download', currentImage.value);
  }
}

function handleKeydown(e) {
  if (!props.visible) return;

  switch (e.key) {
    case 'Escape':
      close();
      break;
    case 'ArrowLeft':
      prev();
      break;
    case 'ArrowRight':
      next();
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
      zoomOut();
      break;
    case '0':
      resetZoom();
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible && currentImage"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        @wheel.prevent="handleWheel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0" @click="close"></div>

        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 z-10 p-3 bg-neu-surface/80 hover:bg-neu-surface rounded-full shadow-neu-raised-sm transition-all"
        >
          <svg class="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Image container -->
        <div
          class="relative max-w-[90vw] max-h-[85vh] select-none"
          :class="{ 'cursor-grab': scale > 1, 'cursor-grabbing': isDragging }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
          @touchstart="startDrag"
          @touchmove="onDrag"
          @touchend="endDrag"
        >
          <img
            :src="currentImage.imageUrl"
            :alt="currentImage.prompt || 'Generated image'"
            class="max-w-full max-h-[85vh] object-contain rounded-lg transition-transform duration-200"
            :style="{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            }"
            draggable="false"
          />
        </div>

        <!-- Navigation arrows -->
        <template v-if="hasMultiple">
          <button
            v-if="currentIndex > 0"
            @click="prev"
            class="absolute left-4 p-3 bg-neu-surface/80 hover:bg-neu-surface rounded-full shadow-neu-raised-sm transition-all"
          >
            <svg class="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            v-if="currentIndex < images.length - 1"
            @click="next"
            class="absolute right-4 p-3 bg-neu-surface/80 hover:bg-neu-surface rounded-full shadow-neu-raised-sm transition-all"
          >
            <svg class="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </template>

        <!-- Bottom toolbar -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-neu-surface/90 rounded-full shadow-neu-raised-sm">
          <!-- Zoom controls -->
          <button
            @click="zoomOut"
            class="p-2 hover:bg-neu-inset rounded-full transition-colors"
            title="Zoom out (-)"
          >
            <svg class="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          <span class="px-2 text-sm text-text-secondary min-w-[50px] text-center">{{ Math.round(scale * 100) }}%</span>
          <button
            @click="zoomIn"
            class="p-2 hover:bg-neu-inset rounded-full transition-colors"
            title="Zoom in (+)"
          >
            <svg class="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            @click="resetZoom"
            class="p-2 hover:bg-neu-inset rounded-full transition-colors"
            title="Reset zoom (0)"
          >
            <svg class="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>

          <div class="w-px h-6 bg-neu-border mx-1"></div>

          <!-- Download -->
          <button
            @click="download"
            class="p-2 hover:bg-neu-inset rounded-full transition-colors"
            title="Download"
          >
            <svg class="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <!-- Counter -->
          <template v-if="hasMultiple">
            <div class="w-px h-6 bg-neu-border mx-1"></div>
            <span class="text-sm text-text-secondary">{{ currentIndex + 1 }} / {{ images.length }}</span>
          </template>
        </div>

        <!-- Image info -->
        <div v-if="currentImage.prompt" class="absolute bottom-20 left-4 right-4 max-w-2xl mx-auto">
          <div class="px-4 py-3 bg-neu-surface/80 rounded-lg backdrop-blur-sm">
            <p class="text-sm text-text-secondary line-clamp-2">{{ currentImage.prompt }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
