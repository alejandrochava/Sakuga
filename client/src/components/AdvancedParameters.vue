<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  provider: {
    type: String,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue']);

const isExpanded = ref(false);

// Default values
const seed = ref(-1);
const steps = ref(30);
const cfgScale = ref(7);
const negativePrompt = ref('');
const sampler = ref('DPM++ 2M Karras');

// Available samplers (common across SD-based models)
const samplers = [
  'DPM++ 2M Karras',
  'DPM++ SDE Karras',
  'DPM++ 2M SDE Karras',
  'Euler a',
  'Euler',
  'DDIM',
  'Heun',
  'LMS'
];

// Define which providers support which advanced parameters
const providerCapabilities = {
  a1111: ['seed', 'steps', 'cfgScale', 'negativePrompt', 'sampler'],
  stability: ['seed', 'negativePrompt'],
  fal: ['seed', 'steps'],
  replicate: ['seed', 'steps'],
  together: ['seed', 'steps'],
  bfl: ['seed', 'steps'],
  openai: [],
  gemini: [],
  ideogram: ['negativePrompt']
};

const supportedParams = computed(() => {
  return providerCapabilities[props.provider] || [];
});

const hasAdvancedParams = computed(() => {
  return supportedParams.value.length > 0;
});

// Emit changes when any parameter updates
watch([seed, steps, cfgScale, negativePrompt, sampler], () => {
  const params = {};

  if (supportedParams.value.includes('seed') && seed.value !== -1) {
    params.seed = seed.value;
  }
  if (supportedParams.value.includes('steps')) {
    params.steps = steps.value;
  }
  if (supportedParams.value.includes('cfgScale')) {
    params.cfgScale = cfgScale.value;
  }
  if (supportedParams.value.includes('negativePrompt') && negativePrompt.value.trim()) {
    params.negativePrompt = negativePrompt.value;
  }
  if (supportedParams.value.includes('sampler')) {
    params.sampler = sampler.value;
  }

  emit('update:modelValue', params);
}, { immediate: true });

// Reset to defaults when provider changes
watch(() => props.provider, () => {
  seed.value = -1;
  steps.value = 30;
  cfgScale.value = 7;
  negativePrompt.value = '';
  sampler.value = 'DPM++ 2M Karras';
});

function randomizeSeed() {
  seed.value = Math.floor(Math.random() * 2147483647);
}
</script>

<template>
  <div v-if="hasAdvancedParams" class="space-y-3">
    <!-- Toggle Button -->
    <button
      @click="isExpanded = !isExpanded"
      class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
    >
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-90': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      Advanced Parameters
    </button>

    <!-- Expandable Panel -->
    <Transition name="expand">
      <div v-if="isExpanded" class="p-4 bg-neu-surface rounded-neu-sm shadow-neu-inset-sm space-y-4">
        <!-- Seed -->
        <div v-if="supportedParams.includes('seed')" class="space-y-2">
          <label class="block text-sm font-medium text-text-secondary">
            Seed
            <span class="text-text-muted font-normal">(-1 for random)</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model.number="seed"
              type="number"
              min="-1"
              max="2147483647"
              class="flex-1 px-3 py-2 bg-neu-dark rounded-neu-sm shadow-neu-inset-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              @click="randomizeSeed"
              class="px-3 py-2 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-neu-sm text-text-secondary hover:text-text-primary transition-all"
              title="Randomize seed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Steps -->
        <div v-if="supportedParams.includes('steps')" class="space-y-2">
          <label class="block text-sm font-medium text-text-secondary">
            Steps
            <span class="text-text-muted font-normal">({{ steps }})</span>
          </label>
          <input
            v-model.number="steps"
            type="range"
            min="10"
            max="100"
            step="5"
            class="w-full accent-accent"
          />
          <div class="flex justify-between text-xs text-text-muted">
            <span>10 (fast)</span>
            <span>100 (quality)</span>
          </div>
        </div>

        <!-- CFG Scale -->
        <div v-if="supportedParams.includes('cfgScale')" class="space-y-2">
          <label class="block text-sm font-medium text-text-secondary">
            CFG Scale
            <span class="text-text-muted font-normal">({{ cfgScale }})</span>
          </label>
          <input
            v-model.number="cfgScale"
            type="range"
            min="1"
            max="20"
            step="0.5"
            class="w-full accent-accent"
          />
          <div class="flex justify-between text-xs text-text-muted">
            <span>1 (creative)</span>
            <span>20 (strict)</span>
          </div>
        </div>

        <!-- Sampler -->
        <div v-if="supportedParams.includes('sampler')" class="space-y-2">
          <label class="block text-sm font-medium text-text-secondary">Sampler</label>
          <select
            v-model="sampler"
            class="w-full px-3 py-2 bg-neu-dark rounded-neu-sm shadow-neu-inset-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option v-for="s in samplers" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <!-- Negative Prompt -->
        <div v-if="supportedParams.includes('negativePrompt')" class="space-y-2">
          <label class="block text-sm font-medium text-text-secondary">Negative Prompt</label>
          <textarea
            v-model="negativePrompt"
            rows="2"
            placeholder="What to avoid in the image..."
            class="w-full px-3 py-2 bg-neu-dark rounded-neu-sm shadow-neu-inset-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
