<script setup>
import { useToast } from '../composables/useToast';

const { toasts, dismiss } = useToast();

const typeStyles = {
  success: 'border-l-green-500 bg-green-500/10',
  error: 'border-l-red-500 bg-red-500/10',
  warning: 'border-l-yellow-500 bg-yellow-500/10',
  info: 'border-l-accent bg-accent/10'
};

const typeIcons = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};

const textColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-accent'
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 p-4 rounded-neu-sm shadow-neu-raised bg-neu-surface border-l-4 backdrop-blur-sm"
          :class="typeStyles[toast.type]"
          role="alert"
        >
          <!-- Icon -->
          <svg
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :class="textColors[toast.type]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="typeIcons[toast.type]"
            />
          </svg>

          <!-- Message -->
          <p class="flex-1 text-sm text-text-primary">{{ toast.message }}</p>

          <!-- Dismiss button -->
          <button
            @click="dismiss(toast.id)"
            class="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Dismiss"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
