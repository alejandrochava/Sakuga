<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const leftIndex = ref(0);
const rightIndex = ref(1);
const comparisonMode = ref('side-by-side'); // 'side-by-side', 'slider', 'overlay'
const sliderPosition = ref(50);
const overlayOpacity = ref(0.5);

const leftImage = computed(() => props.images[leftIndex.value]);
const rightImage = computed(() => props.images[rightIndex.value]);

function selectLeft(index) {
  if (index !== rightIndex.value) {
    leftIndex.value = index;
  }
}

function selectRight(index) {
  if (index !== leftIndex.value) {
    rightIndex.value = index;
  }
}

function swapImages() {
  const temp = leftIndex.value;
  leftIndex.value = rightIndex.value;
  rightIndex.value = temp;
}

function handleSliderDrag(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  sliderPosition.value = Math.max(0, Math.min(100, (x / rect.width) * 100));
}

function handleSliderMove(e) {
  if (e.buttons === 1) {
    handleSliderDrag(e);
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible && images.length >= 2"
        class="fixed inset-0 z-50 flex flex-col bg-black/95"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-neu-border">
          <h2 class="text-lg font-semibold text-text-primary">Compare Images</h2>

          <div class="flex items-center gap-4">
            <!-- Mode selector -->
            <div class="flex gap-1 bg-neu-inset rounded-neu-sm p-1">
              <button
                v-for="mode in ['side-by-side', 'slider', 'overlay']"
                :key="mode"
                @click="comparisonMode = mode"
                class="px-3 py-1.5 text-sm rounded-neu-sm transition-all capitalize"
                :class="comparisonMode === mode
                  ? 'bg-neu-surface shadow-neu-raised-sm text-accent'
                  : 'text-text-muted hover:text-text-primary'"
              >
                {{ mode.replace('-', ' ') }}
              </button>
            </div>

            <!-- Swap button -->
            <button
              @click="swapImages"
              class="p-2 bg-neu-surface shadow-neu-raised-sm rounded-neu-sm text-text-secondary hover:text-accent transition-colors"
              title="Swap images"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <!-- Close -->
            <button
              @click="emit('close')"
              class="p-2 bg-neu-surface shadow-neu-raised-sm rounded-full text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Comparison Area -->
        <div class="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <!-- Side by Side -->
          <div v-if="comparisonMode === 'side-by-side'" class="flex gap-4 max-h-full">
            <div class="flex-1 flex flex-col items-center">
              <img
                :src="leftImage?.imageUrl"
                :alt="leftImage?.prompt"
                class="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
              <p class="mt-2 text-sm text-text-muted text-center line-clamp-2">{{ leftImage?.prompt }}</p>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <img
                :src="rightImage?.imageUrl"
                :alt="rightImage?.prompt"
                class="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
              <p class="mt-2 text-sm text-text-muted text-center line-clamp-2">{{ rightImage?.prompt }}</p>
            </div>
          </div>

          <!-- Slider Mode -->
          <div
            v-else-if="comparisonMode === 'slider'"
            class="relative max-h-[70vh] aspect-square cursor-ew-resize select-none"
            @mousedown="handleSliderDrag"
            @mousemove="handleSliderMove"
          >
            <!-- Right image (background) -->
            <img
              :src="rightImage?.imageUrl"
              :alt="rightImage?.prompt"
              class="absolute inset-0 w-full h-full object-contain rounded-lg"
            />
            <!-- Left image (clipped) -->
            <div
              class="absolute inset-0 overflow-hidden rounded-lg"
              :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
            >
              <img
                :src="leftImage?.imageUrl"
                :alt="leftImage?.prompt"
                class="w-full h-full object-contain"
              />
            </div>
            <!-- Slider handle -->
            <div
              class="absolute top-0 bottom-0 w-1 bg-accent shadow-lg"
              :style="{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }"
            >
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-neu-raised">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Overlay Mode -->
          <div v-else-if="comparisonMode === 'overlay'" class="flex flex-col items-center gap-4">
            <div class="relative max-h-[60vh] aspect-square">
              <img
                :src="leftImage?.imageUrl"
                :alt="leftImage?.prompt"
                class="absolute inset-0 w-full h-full object-contain rounded-lg"
              />
              <img
                :src="rightImage?.imageUrl"
                :alt="rightImage?.prompt"
                class="absolute inset-0 w-full h-full object-contain rounded-lg"
                :style="{ opacity: overlayOpacity }"
              />
            </div>
            <div class="flex items-center gap-4 w-64">
              <span class="text-sm text-text-muted">Left</span>
              <input
                type="range"
                v-model.number="overlayOpacity"
                min="0"
                max="1"
                step="0.01"
                class="flex-1"
              />
              <span class="text-sm text-text-muted">Right</span>
            </div>
          </div>
        </div>

        <!-- Thumbnail Selector -->
        <div class="p-4 border-t border-neu-border">
          <div class="flex gap-4">
            <!-- Left image selector -->
            <div class="flex-1">
              <p class="text-xs text-text-muted mb-2 uppercase tracking-wide">Left Image</p>
              <div class="flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="(image, index) in images"
                  :key="`left-${image.id}`"
                  @click="selectLeft(index)"
                  :disabled="index === rightIndex"
                  class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
                  :class="[
                    index === leftIndex ? 'ring-2 ring-accent' : '',
                    index === rightIndex ? 'opacity-30 cursor-not-allowed' : 'hover:ring-2 hover:ring-accent/50'
                  ]"
                >
                  <img :src="image.imageUrl" :alt="image.prompt" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            <!-- Right image selector -->
            <div class="flex-1">
              <p class="text-xs text-text-muted mb-2 uppercase tracking-wide">Right Image</p>
              <div class="flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="(image, index) in images"
                  :key="`right-${image.id}`"
                  @click="selectRight(index)"
                  :disabled="index === leftIndex"
                  class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
                  :class="[
                    index === rightIndex ? 'ring-2 ring-accent' : '',
                    index === leftIndex ? 'opacity-30 cursor-not-allowed' : 'hover:ring-2 hover:ring-accent/50'
                  ]"
                >
                  <img :src="image.imageUrl" :alt="image.prompt" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
