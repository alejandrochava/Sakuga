<script setup>
import { ref, onMounted, watch } from 'vue';

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
  <div v-if="loading" class="text-gray-500 text-sm">Loading providers...</div>

  <div v-else-if="providers.length === 0" class="text-yellow-500 text-sm">
    No API keys configured. Add keys to your .env file.
  </div>

  <div v-else class="space-y-3">
    <!-- Provider Selection -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="provider in providers"
        :key="provider.id"
        @click="selectProvider(provider.id)"
        class="px-3 py-2 rounded-lg border text-sm transition-colors"
        :class="selectedProvider === provider.id
          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
          : 'border-gray-700 text-gray-400 hover:border-gray-600'"
      >
        {{ provider.name }}
      </button>
    </div>

    <!-- Model Selection (if provider has multiple models) -->
    <div v-if="currentProvider && currentProvider.models.length > 1" class="flex flex-wrap gap-2">
      <button
        v-for="model in currentProvider.models"
        :key="model"
        @click="selectModel(model)"
        class="px-2 py-1 rounded text-xs transition-colors"
        :class="selectedModel === model
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-500 hover:text-gray-400'"
      >
        {{ model }}
      </button>
    </div>

    <!-- Cost Indicator -->
    <div v-if="currentProvider" class="text-xs text-gray-500">
      ~${{ currentProvider.costPerImage.toFixed(3) }}/image
    </div>
  </div>
</template>
