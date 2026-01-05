<script setup>
import { ref } from 'vue';
import { useToast } from '../composables/useToast';

const toast = useToast();

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    default: 'stability'
  }
});

const emit = defineEmits(['upscaled']);

const isUpscaling = ref(false);
const scale = ref(2);
const showOptions = ref(false);

async function upscale() {
  isUpscaling.value = true;
  showOptions.value = false;

  try {
    // Fetch the image and convert to blob
    const imageResponse = await fetch(props.imageUrl);
    const imageBlob = await imageResponse.blob();

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('scale', scale.value.toString());
    formData.append('provider', props.provider);

    const response = await fetch('/api/upscale', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upscale failed');
    }

    emit('upscaled', data);
    toast.success('Image upscaled successfully!');
  } catch (error) {
    console.error('Upscale error:', error);
    toast.error(`Upscale failed: ${error.message}`);
  } finally {
    isUpscaling.value = false;
  }
}
</script>

<template>
  <div class="relative">
    <button
      @click="showOptions = !showOptions"
      :disabled="isUpscaling"
      class="px-3 py-1.5 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-neu-sm text-sm text-text-secondary hover:text-text-primary transition-all duration-200 flex items-center gap-1 disabled:opacity-50 disabled:shadow-none"
    >
      <svg v-if="!isUpscaling" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
      <svg v-else class="w-4 h-4 animate-spin text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      Upscale
    </button>

    <!-- Options Dropdown -->
    <div
      v-if="showOptions"
      class="absolute bottom-full mb-2 left-0 bg-neu-surface rounded-neu-sm shadow-neu-raised-lg p-3 z-10"
    >
      <div class="flex gap-2 mb-2">
        <button
          @click="scale = 2"
          class="px-3 py-1 rounded-lg text-sm transition-all duration-200"
          :class="scale === 2
            ? 'bg-neu-inset shadow-neu-inset-sm text-accent'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary'"
        >
          2x
        </button>
        <button
          @click="scale = 4"
          class="px-3 py-1 rounded-lg text-sm transition-all duration-200"
          :class="scale === 4
            ? 'bg-neu-inset shadow-neu-inset-sm text-accent'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary'"
        >
          4x
        </button>
      </div>
      <button
        @click="upscale"
        class="w-full btn btn-primary text-sm"
      >
        Upscale {{ scale }}x
      </button>
    </div>
  </div>
</template>
