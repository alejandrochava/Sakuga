<script setup>
import { ref, computed } from 'vue';
import PromptInput from '../components/PromptInput.vue';
import ImageUpload from '../components/ImageUpload.vue';
import AspectRatioSelector from '../components/AspectRatioSelector.vue';
import ProviderSelector from '../components/ProviderSelector.vue';
import VariantSelector from '../components/VariantSelector.vue';
import VariantGrid from '../components/VariantGrid.vue';
import EnhanceToggle from '../components/EnhanceToggle.vue';
import MaskEditor from '../components/MaskEditor.vue';
import UpscaleButton from '../components/UpscaleButton.vue';
import CostBadge from '../components/CostBadge.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const prompt = ref('');
const selectedImage = ref(null);
const selectedImageUrl = ref(null);
const aspectRatio = ref('1:1');
const isLoading = ref(false);
const error = ref(null);
const result = ref(null);
const mode = ref('generate');

// New features
const provider = ref('openai');
const model = ref('');
const providerFeatures = ref([]);
const variantCount = ref(1);
const enhancePrompt = ref(false);
const enhancedPromptText = ref('');
const showEnhanced = ref(false);
const maskData = ref(null);
const totalCost = ref(0);

const modes = computed(() => {
  const baseModes = [
    { value: 'generate', label: 'Generate', description: 'Text to image' },
    { value: 'edit', label: 'Edit', description: 'Edit with prompt' },
    { value: 'transform', label: 'Transform', description: 'Style transfer' }
  ];

  if (providerFeatures.value.includes('inpaint')) {
    baseModes.push({ value: 'inpaint', label: 'Inpaint', description: 'Mask & fill' });
  }

  return baseModes;
});

const canSubmit = computed(() => {
  if (!prompt.value.trim()) return false;
  if (mode.value !== 'generate' && !selectedImage.value) return false;
  if (mode.value === 'inpaint' && !maskData.value) return false;
  return true;
});

const loadingText = computed(() => {
  if (showEnhanced.value) return 'Enhancing prompt...';
  const texts = {
    generate: 'Generating image...',
    edit: 'Editing image...',
    transform: 'Transforming image...',
    inpaint: 'Inpainting image...'
  };
  return texts[mode.value];
});

function handleProviderChange({ provider: p, model: m, features }) {
  provider.value = p;
  model.value = m;
  providerFeatures.value = features;

  // Reset mode if current mode not supported
  if (mode.value === 'inpaint' && !features.includes('inpaint')) {
    mode.value = 'generate';
  }
}

function handleImageSelect(file) {
  selectedImage.value = file;
  if (file) {
    selectedImageUrl.value = URL.createObjectURL(file);
  } else {
    selectedImageUrl.value = null;
  }
}

function handleMaskReady(mask) {
  maskData.value = mask;
}

async function handleSubmit() {
  if (!canSubmit.value || isLoading.value) return;

  isLoading.value = true;
  error.value = null;
  result.value = null;
  totalCost.value = 0;

  try {
    let finalPrompt = prompt.value;

    // Enhance prompt if enabled
    if (enhancePrompt.value) {
      showEnhanced.value = true;
      const enhanceResponse = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.value, provider: provider.value })
      });

      const enhanceData = await enhanceResponse.json();
      if (enhanceResponse.ok && enhanceData.enhanced) {
        enhancedPromptText.value = enhanceData.enhanced;
        finalPrompt = enhanceData.enhanced;
      }
      showEnhanced.value = false;
    }

    let response;

    if (mode.value === 'generate') {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          provider: provider.value,
          model: model.value,
          aspectRatio: aspectRatio.value,
          count: variantCount.value
        })
      });
    } else if (mode.value === 'inpaint') {
      const formData = new FormData();
      formData.append('prompt', finalPrompt);
      formData.append('provider', provider.value);
      formData.append('image', selectedImage.value);

      // Convert mask base64 to blob
      const maskBlob = await fetch(`data:image/png;base64,${maskData.value}`).then(r => r.blob());
      formData.append('mask', maskBlob, 'mask.png');

      response = await fetch('/api/inpaint', {
        method: 'POST',
        body: formData
      });
    } else {
      const formData = new FormData();
      formData.append('prompt', finalPrompt);
      formData.append('provider', provider.value);
      formData.append('image', selectedImage.value);

      const endpoint = mode.value === 'edit' ? '/api/edit' : '/api/edit';
      response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Handle response format (single image or array)
    if (data.images) {
      result.value = { images: data.images, totalCost: data.totalCost };
      totalCost.value = data.totalCost || 0;
    } else {
      result.value = { images: [data], totalCost: data.cost };
      totalCost.value = data.cost || 0;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
    showEnhanced.value = false;
  }
}

async function addToQueue() {
  if (!prompt.value.trim()) return;

  try {
    const response = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.value,
        provider: provider.value,
        model: model.value,
        aspectRatio: aspectRatio.value,
        count: variantCount.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add to queue');
    }

    alert('Added to queue!');
  } catch (err) {
    alert(err.message);
  }
}

function handleClear() {
  prompt.value = '';
  selectedImage.value = null;
  selectedImageUrl.value = null;
  result.value = null;
  error.value = null;
  enhancedPromptText.value = '';
  maskData.value = null;
  totalCost.value = 0;
}

function handleUpscaled(data) {
  // Add upscaled image to results
  if (result.value) {
    result.value.images.push(data);
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Provider Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-text-secondary mb-2">AI Provider</label>
      <ProviderSelector
        v-model="provider"
        @provider-change="handleProviderChange"
      />
    </div>

    <!-- Mode Selector -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="m in modes"
        :key="m.value"
        @click="mode = m.value"
        class="flex-1 min-w-[120px] p-3 rounded-neu-sm transition-all text-left"
        :class="mode === m.value
          ? 'bg-neu-surface shadow-neu-inset-sm'
          : 'bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised'"
      >
        <p class="font-medium text-sm" :class="mode === m.value ? 'text-accent' : 'text-text-primary'">
          {{ m.label }}
        </p>
        <p class="text-xs text-text-muted mt-0.5">{{ m.description }}</p>
      </button>
    </div>

    <!-- Input Form -->
    <div class="card p-6 space-y-5">
      <!-- Prompt -->
      <div>
        <label class="block text-sm font-medium text-text-secondary mb-2">Prompt</label>
        <PromptInput v-model="prompt" />
        <div v-if="enhancedPromptText" class="mt-2 p-3 bg-accent/10 rounded-neu-sm shadow-neu-inset-sm text-sm text-accent/80">
          <span class="text-xs text-accent block mb-1">Enhanced:</span>
          {{ enhancedPromptText }}
        </div>
      </div>

      <!-- Enhance Toggle -->
      <EnhanceToggle v-model="enhancePrompt" />

      <!-- Image Upload (for edit/transform/inpaint modes) -->
      <div v-if="mode !== 'generate'">
        <label class="block text-sm font-medium text-text-secondary mb-2">Source Image</label>
        <ImageUpload :model-value="selectedImage" @update:model-value="handleImageSelect" />
      </div>

      <!-- Mask Editor (for inpaint mode) -->
      <div v-if="mode === 'inpaint' && selectedImageUrl">
        <label class="block text-sm font-medium text-text-secondary mb-2">Draw Mask</label>
        <MaskEditor :image-src="selectedImageUrl" @mask-ready="handleMaskReady" />
      </div>

      <!-- Options Row -->
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Aspect Ratio (for generate mode) -->
        <div v-if="mode === 'generate'">
          <label class="block text-sm font-medium text-text-secondary mb-2">Aspect Ratio</label>
          <AspectRatioSelector v-model="aspectRatio" />
        </div>

        <!-- Variants (if supported) -->
        <div v-if="mode === 'generate' && providerFeatures.includes('variants')">
          <VariantSelector v-model="variantCount" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button
          @click="handleSubmit"
          :disabled="!canSubmit || isLoading"
          class="btn btn-primary flex-1 py-3"
        >
          <span v-if="!isLoading">Generate</span>
          <span v-else class="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            {{ loadingText }}
          </span>
        </button>
        <button
          v-if="mode === 'generate'"
          @click="addToQueue"
          :disabled="!prompt.trim() || isLoading"
          class="btn btn-secondary"
          title="Add to queue for background processing"
        >
          + Queue
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

    <!-- Error State -->
    <div v-if="error" class="mt-6 p-4 bg-red-500/10 rounded-neu-sm shadow-neu-inset-sm">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Result -->
    <div v-if="result && result.images.length > 0" class="mt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text-primary">Result</h2>
        <CostBadge :cost="totalCost" size="lg" />
      </div>

      <VariantGrid
        :images="result.images"
        @select="(img) => {}"
      />

      <!-- Upscale button for single result -->
      <div v-if="result.images.length === 1" class="mt-4 flex justify-end">
        <UpscaleButton
          :image-url="result.images[0].imageUrl"
          @upscaled="handleUpscaled"
        />
      </div>
    </div>
  </div>
</template>
