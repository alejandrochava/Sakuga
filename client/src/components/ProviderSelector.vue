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
  <div v-if="loading" class="text-text-muted text-sm">Loading providers...</div>

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
        class="px-4 py-2 rounded-neu-sm text-sm font-medium transition-all duration-200"
        :class="selectedProvider === provider.id
          ? 'bg-neu-surface shadow-neu-inset-sm text-accent'
          : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:shadow-neu-raised hover:text-text-primary'"
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
