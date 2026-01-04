<script setup>
import { ref, computed } from 'vue';
import PromptInput from '../components/PromptInput.vue';
import ImageUpload from '../components/ImageUpload.vue';
import AspectRatioSelector from '../components/AspectRatioSelector.vue';
import ImagePreview from '../components/ImagePreview.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const prompt = ref('');
const selectedImage = ref(null);
const aspectRatio = ref('1:1');
const isLoading = ref(false);
const error = ref(null);
const result = ref(null);
const mode = ref('generate');

const modes = [
  { value: 'generate', label: 'Text to Image', description: 'Generate from prompt' },
  { value: 'edit', label: 'Edit Image', description: 'Edit with prompt' },
  { value: 'transform', label: 'Transform', description: 'Style transfer' }
];

const canSubmit = computed(() => {
  if (!prompt.value.trim()) return false;
  if (mode.value !== 'generate' && !selectedImage.value) return false;
  return true;
});

const loadingText = computed(() => {
  const texts = {
    generate: 'Generating image...',
    edit: 'Editing image...',
    transform: 'Transforming image...'
  };
  return texts[mode.value];
});

async function handleSubmit() {
  if (!canSubmit.value || isLoading.value) return;

  isLoading.value = true;
  error.value = null;
  result.value = null;

  try {
    let response;

    if (mode.value === 'generate') {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.value,
          aspectRatio: aspectRatio.value
        })
      });
    } else {
      const formData = new FormData();
      formData.append('prompt', prompt.value);
      formData.append('image', selectedImage.value);

      const endpoint = mode.value === 'edit' ? '/api/edit' : '/api/image-to-image';
      response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    result.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function handleClear() {
  prompt.value = '';
  selectedImage.value = null;
  result.value = null;
  error.value = null;
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Mode Selector -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="m in modes"
        :key="m.value"
        @click="mode = m.value"
        class="flex-1 p-4 rounded-lg border transition-all text-left"
        :class="mode === m.value
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-gray-700 hover:border-gray-600'"
      >
        <p class="font-medium" :class="mode === m.value ? 'text-primary-400' : 'text-white'">
          {{ m.label }}
        </p>
        <p class="text-xs text-gray-500 mt-1">{{ m.description }}</p>
      </button>
    </div>

    <!-- Input Form -->
    <div class="card p-6 space-y-6">
      <!-- Prompt -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
        <PromptInput v-model="prompt" />
      </div>

      <!-- Image Upload (for edit/transform modes) -->
      <div v-if="mode !== 'generate'">
        <label class="block text-sm font-medium text-gray-300 mb-2">Source Image</label>
        <ImageUpload v-model="selectedImage" />
      </div>

      <!-- Aspect Ratio (for generate mode) -->
      <div v-if="mode === 'generate'">
        <label class="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
        <AspectRatioSelector v-model="aspectRatio" />
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="handleSubmit"
          :disabled="!canSubmit || isLoading"
          class="btn btn-primary flex-1 py-3"
        >
          <span v-if="!isLoading">Generate</span>
          <span v-else class="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Generating...
          </span>
        </button>
        <button
          @click="handleClear"
          :disabled="isLoading"
          class="btn btn-secondary"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-8 py-16">
      <LoadingSpinner size="lg" :text="loadingText" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Result -->
    <div v-else-if="result" class="mt-8">
      <h2 class="text-lg font-semibold text-white mb-4">Result</h2>
      <ImagePreview :src="result.imageUrl" :prompt="result.prompt" />
    </div>
  </div>
</template>
