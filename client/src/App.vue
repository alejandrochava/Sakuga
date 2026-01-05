<script setup>
import { ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import ToastNotification from './components/ToastNotification.vue';

const route = useRoute();
const isMobileMenuOpen = ref(false);

// Close menu on route change
watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
});

const navItems = [
  { path: '/', label: 'Generate' },
  { path: '/history', label: 'History' },
  { path: '/queue', label: 'Queue' },
  { path: '/stats', label: 'Stats' },
  { path: '/help', label: 'Help' }
];
</script>

<template>
  <div class="min-h-screen bg-neu-dark">
    <!-- Header -->
    <header class="border-b border-neu-border/30 sticky top-0 z-40 bg-neu-dark/95 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-11 h-11 bg-neu-surface rounded-neu-sm shadow-neu-raised-sm flex items-center justify-center group-hover:shadow-neu-raised transition-all duration-200">
            <span class="text-accent font-bold text-xl">S</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-text-primary">Sakuga</h1>
            <p class="text-xs text-text-muted">&#20316;&#30011;</p>
          </div>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="route.path === item.path ? 'nav-item-active' : 'nav-item'"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- Mobile Menu Button -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="md:hidden p-2 rounded-neu-sm bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary transition-colors"
          :class="{ 'shadow-neu-inset-sm text-accent': isMobileMenuOpen }"
        >
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Mobile Menu Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="isMobileMenuOpen"
        @click="isMobileMenuOpen = false"
        class="md:hidden fixed inset-0 bg-black/50 z-40"
      />
    </Transition>

    <!-- Mobile Menu Drawer -->
    <Transition name="menu">
      <nav
        v-if="isMobileMenuOpen"
        class="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-neu-surface z-50 shadow-neu-raised-lg p-6 pt-20"
      >
        <div class="space-y-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="block px-4 py-3 rounded-neu-sm text-base font-medium transition-all duration-200"
            :class="route.path === item.path
              ? 'bg-neu-inset shadow-neu-inset-sm text-accent'
              : 'text-text-secondary hover:bg-neu-elevated hover:text-text-primary'"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
    </Transition>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <RouterView />
    </main>

    <!-- Toast Notifications -->
    <ToastNotification />
  </div>
</template>
