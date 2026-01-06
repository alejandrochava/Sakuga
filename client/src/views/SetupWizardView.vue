<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';

const router = useRouter();
const toast = useToast();

const currentStep = ref(0);
const isLoading = ref(true);
const isSaving = ref(false);
const providerInfo = ref({});
const apiKeys = ref({});
const validatingProvider = ref(null);
const validatedProviders = ref({});

const steps = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'api-keys', title: 'API Keys' },
  { id: 'complete', title: 'Complete' }
];

const providerList = [
  { id: 'openai', icon: 'O' },
  { id: 'gemini', icon: 'G' },
  { id: 'stability', icon: 'S' },
  { id: 'replicate', icon: 'R' },
  { id: 'fal', icon: 'F' },
  { id: 'together', icon: 'T' },
  { id: 'ideogram', icon: 'I' },
  { id: 'bfl', icon: 'B' }
];

const configuredCount = computed(() => {
  return Object.values(apiKeys.value).filter(k => k && k.trim()).length;
});

onMounted(async () => {
  await fetchSetupStatus();
  isLoading.value = false;
});

async function fetchSetupStatus() {
  try {
    const response = await fetch('/api/setup/status');
    if (response.ok) {
      const data = await response.json();
      providerInfo.value = data.providerInfo || {};
      // Don't redirect - allow users to access /setup anytime to add keys
    }
  } catch (error) {
    console.error('Failed to fetch setup status:', error);
  }
}

async function validateKey(providerId) {
  const key = apiKeys.value[providerId];
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
      validatedProviders.value[providerId] = true;
      toast.success(`${providerInfo.value[providerId]?.name || providerId} key is valid!`);
    } else {
      validatedProviders.value[providerId] = false;
      toast.error(`Invalid API key for ${providerInfo.value[providerId]?.name || providerId}`);
    }
  } catch (error) {
    toast.error('Failed to validate key');
  } finally {
    validatingProvider.value = null;
  }
}

async function saveKey(providerId) {
  const key = apiKeys.value[providerId];
  if (!key || !key.trim()) return;

  try {
    const response = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: providerId, apiKey: key.trim() })
    });

    if (response.ok) {
      validatedProviders.value[providerId] = true;
      toast.success(`${providerInfo.value[providerId]?.name || providerId} key saved!`);
    } else {
      throw new Error('Failed to save key');
    }
  } catch (error) {
    toast.error('Failed to save key');
  }
}

async function completeSetup() {
  isSaving.value = true;

  try {
    // Save all entered keys
    for (const [providerId, key] of Object.entries(apiKeys.value)) {
      if (key && key.trim()) {
        await fetch('/api/settings/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: providerId, apiKey: key.trim() })
        });
      }
    }

    // Mark setup as complete
    await fetch('/api/setup/complete', { method: 'POST' });

    currentStep.value = 2; // Show complete step
  } catch (error) {
    toast.error('Failed to save settings');
  } finally {
    isSaving.value = false;
  }
}

function skipSetup() {
  if (confirm('Are you sure you want to skip setup? You can configure API keys later in Settings.')) {
    completeSetupAndRedirect();
  }
}

async function completeSetupAndRedirect() {
  try {
    await fetch('/api/setup/complete', { method: 'POST' });
    router.replace('/');
  } catch (error) {
    router.replace('/');
  }
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    if (currentStep.value === 1) {
      completeSetup();
    } else {
      currentStep.value++;
    }
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function goToApp() {
  router.replace('/');
}
</script>

<template>
  <div class="min-h-screen bg-neu-dark flex flex-col">
    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-text-muted">Loading...</div>
    </div>

    <!-- Wizard Content -->
    <div v-else class="flex-1 flex flex-col">
      <!-- Progress Bar -->
      <div class="px-6 py-4 border-b border-neu-border">
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-text-muted">Step {{ currentStep + 1 }} of {{ steps.length }}</span>
            <span class="text-sm text-text-secondary">{{ steps[currentStep].title }}</span>
          </div>
          <div class="h-1 bg-neu-inset rounded-full overflow-hidden">
            <div
              class="h-full bg-accent transition-all duration-300"
              :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-2xl">
          <!-- Step 0: Welcome -->
          <div v-if="currentStep === 0" class="text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-full mb-6">
              <svg class="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-text-primary mb-4">Welcome to Sakuga</h1>
            <p class="text-text-secondary mb-8 max-w-md mx-auto">
              Generate stunning images with AI. Connect your API keys to get started with providers like OpenAI, Google Gemini, Stability AI, and more.
            </p>

            <div class="card p-6 text-left mb-8">
              <h3 class="font-semibold text-text-primary mb-3">What you'll need:</h3>
              <ul class="space-y-2 text-sm text-text-secondary">
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  At least one API key from a supported provider
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Each provider offers different models and pricing
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  You can add or change keys later in Settings
                </li>
              </ul>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button @click="nextStep" class="btn-primary px-8 py-3">
                Get Started
              </button>
              <button @click="skipSetup" class="btn-ghost px-8 py-3">
                Skip for now
              </button>
            </div>
          </div>

          <!-- Step 1: API Keys -->
          <div v-else-if="currentStep === 1">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-text-primary mb-2">Configure API Keys</h2>
              <p class="text-text-secondary">
                Enter your API keys for the providers you want to use.
                <span v-if="configuredCount > 0" class="text-accent">{{ configuredCount }} configured</span>
              </p>
            </div>

            <div class="space-y-4 mb-8">
              <div
                v-for="provider in providerList"
                :key="provider.id"
                class="card p-4"
              >
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold flex-shrink-0">
                    {{ provider.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class="font-medium text-text-primary">
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
                    <p class="text-xs text-text-muted mb-2">
                      {{ providerInfo[provider.id]?.description || 'AI image generation' }}
                    </p>
                    <div class="flex gap-2">
                      <input
                        v-model="apiKeys[provider.id]"
                        type="password"
                        :placeholder="providerInfo[provider.id]?.keyPlaceholder || 'Enter API key'"
                        class="flex-1 px-3 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
                        @input="validatedProviders[provider.id] = null"
                      />
                      <button
                        @click="validateKey(provider.id)"
                        :disabled="!apiKeys[provider.id] || validatingProvider === provider.id"
                        class="px-3 py-2 bg-neu-surface shadow-neu-raised-sm rounded-neu-sm text-sm transition-colors disabled:opacity-50"
                        :class="{
                          'text-accent': validatedProviders[provider.id] === true,
                          'text-red-400': validatedProviders[provider.id] === false,
                          'text-text-secondary hover:text-text-primary': validatedProviders[provider.id] === null || validatedProviders[provider.id] === undefined
                        }"
                      >
                        <span v-if="validatingProvider === provider.id">...</span>
                        <span v-else-if="validatedProviders[provider.id] === true">Valid</span>
                        <span v-else-if="validatedProviders[provider.id] === false">Invalid</span>
                        <span v-else>Test</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-between">
              <button @click="prevStep" class="btn-ghost px-6 py-2.5">
                Back
              </button>
              <div class="flex gap-3">
                <button @click="skipSetup" class="btn-ghost px-6 py-2.5">
                  Skip
                </button>
                <button
                  @click="nextStep"
                  :disabled="isSaving"
                  class="btn-primary px-6 py-2.5"
                >
                  {{ isSaving ? 'Saving...' : configuredCount > 0 ? 'Continue' : 'Skip & Continue' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: Complete -->
          <div v-else-if="currentStep === 2" class="text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-full mb-6">
              <svg class="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-text-primary mb-4">You're all set!</h2>
            <p class="text-text-secondary mb-8">
              <template v-if="configuredCount > 0">
                {{ configuredCount }} provider{{ configuredCount > 1 ? 's' : '' }} configured. You can start generating images now.
              </template>
              <template v-else>
                No providers configured yet. You can add API keys anytime in Settings.
              </template>
            </p>

            <button @click="goToApp" class="btn-primary px-8 py-3">
              Start Creating
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
