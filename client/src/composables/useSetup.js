import { ref } from 'vue';

const setupStatus = ref(null);
const isChecking = ref(false);

export function useSetup() {
  async function checkSetupStatus() {
    if (isChecking.value) return setupStatus.value;

    isChecking.value = true;

    try {
      const response = await fetch('/api/setup/status');
      if (response.ok) {
        setupStatus.value = await response.json();
      } else {
        // Default to complete if we can't check (avoids blocking users)
        setupStatus.value = { setupComplete: true, configuredProviders: [] };
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
      // Default to complete if we can't check
      setupStatus.value = { setupComplete: true, configuredProviders: [] };
    } finally {
      isChecking.value = false;
    }

    return setupStatus.value;
  }

  function isSetupComplete() {
    return setupStatus.value?.setupComplete ?? false;
  }

  function getConfiguredProviders() {
    return setupStatus.value?.configuredProviders ?? [];
  }

  function resetStatus() {
    setupStatus.value = null;
  }

  return {
    setupStatus,
    isChecking,
    checkSetupStatus,
    isSetupComplete,
    getConfiguredProviders,
    resetStatus
  };
}
