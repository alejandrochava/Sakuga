<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from '../composables/useToast';
import SkeletonLoader from '../components/SkeletonLoader.vue';

const toast = useToast();

const SETTINGS_KEY = 'sakuga-settings';

// Settings state
const settings = ref({
  defaultProvider: 'openai',
  defaultAspectRatio: '1:1',
  enhanceByDefault: false,
  showCostBadge: true,
  autoSaveHistory: true,
  theme: 'dark',
  gridColumns: 3
});

const providers = ref([]);
const isLoading = ref(true);

// API Keys state
const apiKeys = ref([]);
const providerInfo = ref({});
const newApiKeys = ref({});
const validatingProvider = ref(null);
const savingProvider = ref(null);
const showApiKeysSection = ref(true);

const aspectRatios = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:4', label: 'Portrait (3:4)' }
];

const gridOptions = [
  { value: 2, label: '2 columns' },
  { value: 3, label: '3 columns' },
  { value: 4, label: '4 columns' }
];

onMounted(async () => {
  loadSettings();
  await Promise.all([fetchProviders(), fetchApiKeys()]);
  isLoading.value = false;
});

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      settings.value = { ...settings.value, ...JSON.parse(saved) };
    }
  } catch {
    // Use defaults
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
  toast.success('Settings saved');
}

async function fetchProviders() {
  try {
    const response = await fetch('/api/providers');
    if (response.ok) {
      providers.value = await response.json();
    }
  } catch {
    // Use empty array
  }
}

async function fetchApiKeys() {
  try {
    const response = await fetch('/api/settings/api-keys');
    if (response.ok) {
      const data = await response.json();
      apiKeys.value = data.keys || [];
      providerInfo.value = data.providerInfo || {};
    }
  } catch {
    // Use empty arrays
  }
}

const allProviders = [
  { id: 'openai', icon: 'O' },
  { id: 'gemini', icon: 'G' },
  { id: 'stability', icon: 'S' },
  { id: 'replicate', icon: 'R' },
  { id: 'fal', icon: 'F' },
  { id: 'together', icon: 'T' },
  { id: 'ideogram', icon: 'I' },
  { id: 'bfl', icon: 'B' }
];

function getConfiguredKey(providerId) {
  return apiKeys.value.find(k => k.provider === providerId);
}

async function saveApiKey(providerId) {
  const key = newApiKeys.value[providerId];
  if (!key || !key.trim()) {
    toast.error('Please enter an API key');
    return;
  }

  savingProvider.value = providerId;

  try {
    const response = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: providerId, apiKey: key.trim() })
    });

    if (response.ok) {
      newApiKeys.value[providerId] = '';
      await fetchApiKeys();
      await fetchProviders();
      toast.success(`${providerInfo.value[providerId]?.name || providerId} key saved!`);
    } else {
      throw new Error('Failed to save');
    }
  } catch (error) {
    toast.error('Failed to save API key');
  } finally {
    savingProvider.value = null;
  }
}

async function deleteApiKey(providerId) {
  if (!confirm(`Remove API key for ${providerInfo.value[providerId]?.name || providerId}?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/settings/api-keys/${providerId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await fetchApiKeys();
      await fetchProviders();
      toast.success('API key removed');
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    toast.error('Failed to remove API key');
  }
}

async function validateApiKey(providerId) {
  const key = newApiKeys.value[providerId];
  if (!key || !key.trim()) {
    toast.error('Please enter an API key');
    return;
  }

  validatingProvider.value = providerId;

  try {
    const response = await fetch('/api/settings/api-keys/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: providerId, apiKey: key.trim() })
    });

    const data = await response.json();

    if (data.valid) {
      toast.success('API key is valid!');
    } else {
      toast.error('Invalid API key');
    }
  } catch (error) {
    toast.error('Failed to validate key');
  } finally {
    validatingProvider.value = null;
  }
}

function clearAllData() {
  if (confirm('Are you sure you want to clear all local data? This includes favorites, templates, and settings.')) {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem('sakuga-favorites');
    localStorage.removeItem('sakuga-prompt-templates');
    settings.value = {
      defaultProvider: 'openai',
      defaultAspectRatio: '1:1',
      enhanceByDefault: false,
      showCostBadge: true,
      autoSaveHistory: true,
      theme: 'dark',
      gridColumns: 3
    };
    toast.success('All local data cleared');
  }
}

async function clearHistory() {
  if (confirm('Are you sure you want to delete all generation history? This cannot be undone.')) {
    try {
      const response = await fetch('/api/history', { method: 'DELETE' });
      if (response.ok) {
        toast.success('History cleared');
      } else {
        throw new Error('Failed to clear history');
      }
    } catch (err) {
      toast.error(err.message);
    }
  }
}

// Auto-save when settings change
watch(settings, () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
}, { deep: true });
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-text-primary mb-6">Settings</h1>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-6">
      <div class="card p-6">
        <div class="skeleton h-6 w-24 rounded mb-4"></div>
        <div class="space-y-4">
          <SkeletonLoader type="card" :count="3" class-name="!p-4 !space-y-2" />
        </div>
      </div>
      <div class="card p-6">
        <div class="skeleton h-6 w-32 rounded mb-4"></div>
        <div class="space-y-3">
          <div class="skeleton h-10 w-full rounded"></div>
          <div class="skeleton h-10 w-full rounded"></div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- API Keys Section -->
      <section class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-text-primary">API Keys</h2>
          <button
            @click="showApiKeysSection = !showApiKeysSection"
            class="text-sm text-accent hover:underline"
          >
            {{ showApiKeysSection ? 'Hide' : 'Show' }}
          </button>
        </div>

        <p class="text-sm text-text-muted mb-4">
          {{ apiKeys.filter(k => !k.source).length }} provider(s) configured via app.
          {{ apiKeys.filter(k => k.source === 'env').length > 0 ? `${apiKeys.filter(k => k.source === 'env').length} from environment.` : '' }}
        </p>

        <div v-if="showApiKeysSection" class="space-y-4">
          <div
            v-for="provider in allProviders"
            :key="provider.id"
            class="p-4 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                {{ provider.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-medium text-text-primary text-sm">
                    {{ providerInfo[provider.id]?.name || provider.id }}
                  </h3>
                  <a
                    :href="providerInfo[provider.id]?.keyUrl"
                    target="_blank"
                    class="text-xs text-accent hover:underline"
                  >
                    Get key
                  </a>
                </div>

                <!-- Configured key display -->
                <div v-if="getConfiguredKey(provider.id)" class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-text-muted font-mono">
                    {{ getConfiguredKey(provider.id).apiKey }}
                  </span>
                  <span v-if="getConfiguredKey(provider.id).source === 'env'" class="text-xs text-accent">(env)</span>
                  <button
                    v-if="getConfiguredKey(provider.id).source !== 'env'"
                    @click="deleteApiKey(provider.id)"
                    class="text-xs text-red-400 hover:underline ml-auto"
                  >
                    Remove
                  </button>
                </div>

                <!-- Add/Update key input -->
                <div class="flex gap-2">
                  <input
                    v-model="newApiKeys[provider.id]"
                    type="password"
                    :placeholder="getConfiguredKey(provider.id) ? 'Enter new key to update' : 'Enter API key'"
                    class="flex-1 px-2 py-1.5 bg-neu-surface shadow-neu-raised-sm rounded text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent/30"
                  />
                  <button
                    @click="validateApiKey(provider.id)"
                    :disabled="!newApiKeys[provider.id] || validatingProvider === provider.id"
                    class="px-2 py-1.5 bg-neu-surface shadow-neu-raised-sm rounded text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    {{ validatingProvider === provider.id ? '...' : 'Test' }}
                  </button>
                  <button
                    @click="saveApiKey(provider.id)"
                    :disabled="!newApiKeys[provider.id] || savingProvider === provider.id"
                    class="px-2 py-1.5 bg-accent/20 rounded text-xs text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
                  >
                    {{ savingProvider === provider.id ? '...' : 'Save' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Default Preferences -->
      <section class="card p-6">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Default Preferences</h2>

        <div class="space-y-4">
          <!-- Default Provider -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">
              Default Provider
            </label>
            <select
              v-model="settings.defaultProvider"
              class="w-full px-3 py-2.5 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <option v-for="provider in providers" :key="provider.name" :value="provider.name">
                {{ provider.name.charAt(0).toUpperCase() + provider.name.slice(1) }}
              </option>
            </select>
          </div>

          <!-- Default Aspect Ratio -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">
              Default Aspect Ratio
            </label>
            <select
              v-model="settings.defaultAspectRatio"
              class="w-full px-3 py-2.5 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <option v-for="ratio in aspectRatios" :key="ratio.value" :value="ratio.value">
                {{ ratio.label }}
              </option>
            </select>
          </div>

          <!-- Enhance by Default -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-text-primary">Enhance Prompts by Default</label>
              <p class="text-xs text-text-muted mt-0.5">Automatically enhance prompts before generation</p>
            </div>
            <button
              @click="settings.enhanceByDefault = !settings.enhanceByDefault"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="settings.enhanceByDefault ? 'bg-accent/30' : 'bg-neu-inset shadow-neu-inset-sm'"
            >
              <div
                class="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-neu-raised-sm"
                :class="settings.enhanceByDefault ? 'left-6 bg-accent' : 'left-0.5 bg-neu-elevated'"
              ></div>
            </button>
          </div>
        </div>
      </section>

      <!-- Display Settings -->
      <section class="card p-6">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Display</h2>

        <div class="space-y-4">
          <!-- Show Cost Badge -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-text-primary">Show Cost Badge</label>
              <p class="text-xs text-text-muted mt-0.5">Display generation costs in the UI</p>
            </div>
            <button
              @click="settings.showCostBadge = !settings.showCostBadge"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="settings.showCostBadge ? 'bg-accent/30' : 'bg-neu-inset shadow-neu-inset-sm'"
            >
              <div
                class="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-neu-raised-sm"
                :class="settings.showCostBadge ? 'left-6 bg-accent' : 'left-0.5 bg-neu-elevated'"
              ></div>
            </button>
          </div>

          <!-- Grid Columns -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">
              History Grid Columns
            </label>
            <div class="flex gap-2">
              <button
                v-for="option in gridOptions"
                :key="option.value"
                @click="settings.gridColumns = option.value"
                class="flex-1 px-3 py-2 rounded-neu-sm text-sm transition-all"
                :class="settings.gridColumns === option.value
                  ? 'bg-accent/20 text-accent shadow-neu-inset-sm'
                  : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary'"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Data Management -->
      <section class="card p-6">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Data Management</h2>

        <div class="space-y-4">
          <!-- Auto-save History -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-text-primary">Auto-save to History</label>
              <p class="text-xs text-text-muted mt-0.5">Automatically save generated images to history</p>
            </div>
            <button
              @click="settings.autoSaveHistory = !settings.autoSaveHistory"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="settings.autoSaveHistory ? 'bg-accent/30' : 'bg-neu-inset shadow-neu-inset-sm'"
            >
              <div
                class="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-neu-raised-sm"
                :class="settings.autoSaveHistory ? 'left-6 bg-accent' : 'left-0.5 bg-neu-elevated'"
              ></div>
            </button>
          </div>

          <!-- Clear Actions -->
          <div class="pt-4 border-t border-neu-border space-y-3">
            <button
              @click="clearHistory"
              class="w-full px-4 py-2.5 bg-neu-surface shadow-neu-raised-sm rounded-neu-sm text-text-secondary hover:text-red-400 transition-colors text-sm"
            >
              Clear Generation History
            </button>
            <button
              @click="clearAllData"
              class="w-full px-4 py-2.5 bg-red-500/10 rounded-neu-sm text-red-400 hover:bg-red-500/20 transition-colors text-sm"
            >
              Clear All Local Data
            </button>
          </div>
        </div>
      </section>

      <!-- Keyboard Shortcuts -->
      <section class="card p-6">
        <h2 class="text-lg font-semibold text-text-primary mb-4">Keyboard Shortcuts</h2>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Generate image</span>
            <span class="px-2 py-1 bg-neu-inset shadow-neu-inset-sm rounded text-text-muted font-mono text-xs">
              Ctrl/Cmd + Enter
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Clear form</span>
            <span class="px-2 py-1 bg-neu-inset shadow-neu-inset-sm rounded text-text-muted font-mono text-xs">
              Escape
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Lightbox: Zoom in</span>
            <span class="px-2 py-1 bg-neu-inset shadow-neu-inset-sm rounded text-text-muted font-mono text-xs">
              + / =
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Lightbox: Zoom out</span>
            <span class="px-2 py-1 bg-neu-inset shadow-neu-inset-sm rounded text-text-muted font-mono text-xs">
              -
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Lightbox: Navigate</span>
            <span class="px-2 py-1 bg-neu-inset shadow-neu-inset-sm rounded text-text-muted font-mono text-xs">
              Arrow Keys
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Close lightbox/modal</span>
            <span class="px-2 py-1 bg-neu-inset shadow-neu-inset-sm rounded text-text-muted font-mono text-xs">
              Escape
            </span>
          </div>
        </div>
      </section>

      <!-- About -->
      <section class="card p-6">
        <h2 class="text-lg font-semibold text-text-primary mb-4">About</h2>
        <div class="text-sm text-text-secondary space-y-2">
          <p><strong>Sakuga</strong> - AI Image Generation Tool</p>
          <p class="text-text-muted">
            A unified interface for multiple AI image generation providers including OpenAI,
            Stability AI, Replicate, and more.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
