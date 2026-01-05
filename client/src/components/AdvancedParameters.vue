<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

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

const isOpen = ref(false);
const popoverRef = ref(null);
const buttonRef = ref(null);

// Default values
const seed = ref(-1);
const steps = ref(30);
const cfgScale = ref(7);
const negativePrompt = ref('');
const sampler = ref('DPM++ 2M Karras');

// Available samplers
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

// Provider capabilities
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

// Summary text for the button
const summaryText = computed(() => {
  const parts = [];
  if (supportedParams.value.includes('seed') && seed.value !== -1) {
    parts.push(`seed:${seed.value}`);
  }
  if (supportedParams.value.includes('steps') && steps.value !== 30) {
    parts.push(`${steps.value} steps`);
  }
  if (supportedParams.value.includes('cfgScale') && cfgScale.value !== 7) {
    parts.push(`cfg:${cfgScale.value}`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
});

// Emit changes
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

// Reset when provider changes
watch(() => props.provider, () => {
  seed.value = -1;
  steps.value = 30;
  cfgScale.value = 7;
  negativePrompt.value = '';
  sampler.value = 'DPM++ 2M Karras';
  isOpen.value = false;
});

function randomizeSeed() {
  seed.value = Math.floor(Math.random() * 2147483647);
}

function resetToDefaults() {
  seed.value = -1;
  steps.value = 30;
  cfgScale.value = 7;
  negativePrompt.value = '';
  sampler.value = 'DPM++ 2M Karras';
}

// Click outside to close
function handleClickOutside(event) {
  if (isOpen.value && popoverRef.value && buttonRef.value) {
    if (!popoverRef.value.contains(event.target) && !buttonRef.value.contains(event.target)) {
      isOpen.value = false;
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div v-if="hasAdvancedParams" class="relative">
    <!-- Floating Button -->
    <button
      ref="buttonRef"
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 bg-neu-surface rounded-neu-sm transition-all duration-200"
      :class="isOpen
        ? 'shadow-neu-inset-sm text-accent'
        : 'shadow-neu-raised-sm hover:shadow-neu-raised text-text-secondary hover:text-text-primary'"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="text-sm font-medium">Advanced</span>
      <span v-if="summaryText" class="text-xs text-accent/70 hidden sm:inline">
        ({{ summaryText }})
      </span>
    </button>

    <!-- Popover -->
    <Transition name="popover">
      <div
        v-if="isOpen"
        ref="popoverRef"
        class="absolute bottom-full mb-2 right-0 w-72 p-4 bg-neu-surface rounded-neu-md shadow-neu-raised-lg backdrop-blur-sm border border-neu-border/20 z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-neu-border/20">
          <h3 class="text-sm font-semibold text-text-primary">Advanced Settings</h3>
          <button
            @click="resetToDefaults"
            class="text-xs text-text-muted hover:text-accent transition-colors"
          >
            Reset
          </button>
        </div>

        <div class="space-y-4">
          <!-- Seed -->
          <div v-if="supportedParams.includes('seed')" class="space-y-1.5">
            <label class="flex items-center justify-between text-xs font-medium text-text-secondary">
              <span>Seed</span>
              <span class="text-text-muted">-1 = random</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model.number="seed"
                type="number"
                min="-1"
                max="2147483647"
                class="flex-1 px-2.5 py-1.5 bg-neu-dark rounded-neu-sm shadow-neu-inset-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                @click="randomizeSeed"
                class="px-2.5 py-1.5 bg-neu-surface shadow-neu-raised-sm hover:shadow-neu-raised rounded-neu-sm text-text-secondary hover:text-accent transition-all"
                title="Random seed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Steps -->
          <div v-if="supportedParams.includes('steps')" class="space-y-1.5">
            <label class="flex items-center justify-between text-xs font-medium text-text-secondary">
              <span>Steps</span>
              <span class="text-accent tabular-nums">{{ steps }}</span>
            </label>
            <input
              v-model.number="steps"
              type="range"
              min="10"
              max="100"
              step="5"
              class="w-full accent-accent h-1.5"
            />
          </div>

          <!-- CFG Scale -->
          <div v-if="supportedParams.includes('cfgScale')" class="space-y-1.5">
            <label class="flex items-center justify-between text-xs font-medium text-text-secondary">
              <span>CFG Scale</span>
              <span class="text-accent tabular-nums">{{ cfgScale }}</span>
            </label>
            <input
              v-model.number="cfgScale"
              type="range"
              min="1"
              max="20"
              step="0.5"
              class="w-full accent-accent h-1.5"
            />
          </div>

          <!-- Sampler -->
          <div v-if="supportedParams.includes('sampler')" class="space-y-1.5">
            <label class="text-xs font-medium text-text-secondary">Sampler</label>
            <select
              v-model="sampler"
              class="w-full px-2.5 py-1.5 bg-neu-dark rounded-neu-sm shadow-neu-inset-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option v-for="s in samplers" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <!-- Negative Prompt -->
          <div v-if="supportedParams.includes('negativePrompt')" class="space-y-1.5">
            <label class="text-xs font-medium text-text-secondary">Negative Prompt</label>
            <textarea
              v-model="negativePrompt"
              rows="2"
              placeholder="What to avoid..."
              class="w-full px-2.5 py-1.5 bg-neu-dark rounded-neu-sm shadow-neu-inset-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none placeholder:text-text-muted/50"
            />
          </div>
        </div>

        <!-- Arrow pointer -->
        <div class="absolute -bottom-2 right-6 w-4 h-4 bg-neu-surface rotate-45 border-r border-b border-neu-border/20"></div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.popover-enter-active {
  transition: all 0.2s ease-out;
}

.popover-leave-active {
  transition: all 0.15s ease-in;
}

.popover-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}

.popover-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

/* Custom range slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: var(--color-neu-dark, #1a1a1a);
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(255, 255, 255, 0.05);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent, #00ff88);
  margin-top: -5px;
  box-shadow: 0 2px 6px rgba(0, 255, 136, 0.3);
  transition: transform 0.1s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

input[type="range"]::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: var(--color-neu-dark, #1a1a1a);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent, #00ff88);
  border: none;
  box-shadow: 0 2px 6px rgba(0, 255, 136, 0.3);
}
</style>
