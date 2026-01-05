<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'providerChange']);

const providers = ref([]);
const selectedProvider = ref(props.modelValue);
const selectedModel = ref('');
const loading = ref(true);

// Group providers by type
const cloudProviders = computed(() =>
  providers.value.filter(p => p.type === 'cloud')
);

const localProviders = computed(() =>
  providers.value.filter(p => p.type === 'local')
);

async function fetchProviders() {
  try {
    const response = await fetch('/api/providers');
    providers.value = await response.json();

    // Set default provider
    if (!selectedProvider.value && providers.value.length > 0) {
      const saved = localStorage.getItem('sakuga-provider');
      selectedProvider.value = saved && providers.value.find(p => p.id === saved)
        ? saved
        : providers.value[0].id;
    }

    // Set default model
    const provider = providers.value.find(p => p.id === selectedProvider.value);
    if (provider) {
      const savedModel = localStorage.getItem(`sakuga-model-${provider.id}`);
      selectedModel.value = savedModel && provider.models.includes(savedModel)
        ? savedModel
        : provider.models[0];
    }

    emitChange();
  } catch (error) {
    console.error('Failed to fetch providers:', error);
  } finally {
    loading.value = false;
  }
}

function selectProvider(providerId) {
  selectedProvider.value = providerId;
  localStorage.setItem('sakuga-provider', providerId);

  const provider = providers.value.find(p => p.id === providerId);
  if (provider) {
    selectedModel.value = provider.models[0];
    localStorage.setItem(`sakuga-model-${providerId}`, provider.models[0]);
  }

  emitChange();
}

function selectModel(model) {
  selectedModel.value = model;
  localStorage.setItem(`sakuga-model-${selectedProvider.value}`, model);
  emitChange();
}

function emitChange() {
  emit('update:modelValue', selectedProvider.value);
  emit('providerChange', {
    provider: selectedProvider.value,
    model: selectedModel.value,
    features: currentProvider.value?.features || []
  });
}

const currentProvider = ref(null);

watch([selectedProvider, providers], () => {
  currentProvider.value = providers.value.find(p => p.id === selectedProvider.value);
}, { immediate: true });

onMounted(fetchProviders);
</script>

<template>
  <div v-if="loading" class="text-text-muted text-sm">Loading providers...</div>

  <div v-else-if="providers.length === 0" class="text-yellow-500 text-sm">
    No API keys configured. Add keys to your .env file.
  </div>

  <div v-else class="space-y-4">
    <!-- Cloud Providers Section -->
    <div v-if="cloudProviders.length > 0">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Cloud</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="provider in cloudProviders"
          :key="provider.id"
          @click="selectProvider(provider.id)"
          class="px-4 py-2.5 min-h-[44px] rounded-neu-sm text-sm font-medium transition-all duration-200"
          :class="selectedProvider === provider.id
            ? 'bg-neu-surface shadow-neu-inset-sm text-accent'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:shadow-neu-raised hover:text-text-primary'"
        >
          {{ provider.name }}
        </button>
      </div>
    </div>

    <!-- Local Providers Section -->
    <div v-if="localProviders.length > 0">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Local</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="provider in localProviders"
          :key="provider.id"
          @click="selectProvider(provider.id)"
          class="px-4 py-2.5 min-h-[44px] rounded-neu-sm text-sm font-medium transition-all duration-200"
          :class="selectedProvider === provider.id
            ? 'bg-neu-surface shadow-neu-inset-sm text-accent'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:shadow-neu-raised hover:text-text-primary'"
        >
          {{ provider.name }}
        </button>
      </div>
    </div>

    <!-- Model Selection (if provider has multiple models) -->
    <div v-if="currentProvider && currentProvider.models.length > 1" class="flex flex-wrap gap-2">
      <button
        v-for="model in currentProvider.models"
        :key="model"
        @click="selectModel(model)"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
        :class="selectedModel === model
          ? 'bg-neu-inset shadow-neu-inset-sm text-accent'
          : 'bg-neu-surface shadow-neu-raised-sm text-text-muted hover:text-text-secondary'"
      >
        {{ model }}
      </button>
    </div>

    <!-- Cost Indicator -->
    <div v-if="currentProvider" class="text-xs text-text-muted">
      ~${{ currentProvider.costPerImage.toFixed(3) }}/image
    </div>
  </div>
</template>
