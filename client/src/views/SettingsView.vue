<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from '../composables/useToast';

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
  await fetchProviders();
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

    <div v-if="isLoading" class="text-center py-16 text-text-muted">
      Loading settings...
    </div>

    <div v-else class="space-y-6">
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
