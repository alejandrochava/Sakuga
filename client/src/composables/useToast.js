import { ref } from 'vue';

// Global toast state (singleton)
const toasts = ref([]);
let toastId = 0;

/**
 * Toast notification composable
 * Provides global toast notifications across the app
 */
export function useToast() {
  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {'success' | 'error' | 'warning' | 'info'} type - Toast type
   * @param {number} duration - Duration in ms (0 for persistent)
   * @returns {number} - Toast ID for manual dismissal
   */
  function show(message, type = 'info', duration = 5000) {
    const id = ++toastId;
    const toast = { id, message, type, duration };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }

    return id;
  }

  /**
   * Dismiss a toast by ID
   * @param {number} id - Toast ID to dismiss
   */
  function dismiss(id) {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  /**
   * Dismiss all toasts
   */
  function dismissAll() {
    toasts.value = [];
  }

  return {
    toasts,
    show,
    dismiss,
    dismissAll,
    // Convenience methods
    success: (message, duration = 4000) => show(message, 'success', duration),
    error: (message, duration = 8000) => show(message, 'error', duration),
    warning: (message, duration = 6000) => show(message, 'warning', duration),
    info: (message, duration = 5000) => show(message, 'info', duration)
  };
}
