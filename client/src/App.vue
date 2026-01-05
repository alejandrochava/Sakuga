<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router';
import ToastNotification from './components/ToastNotification.vue';

const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-neu-dark">
    <!-- Header -->
    <header class="border-b border-neu-border/30">
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

        <nav class="flex gap-2">
          <RouterLink
            to="/"
            :class="route.path === '/' ? 'nav-item-active' : 'nav-item'"
          >
            Generate
          </RouterLink>
          <RouterLink
            to="/history"
            :class="route.path === '/history' ? 'nav-item-active' : 'nav-item'"
          >
            History
          </RouterLink>
          <RouterLink
            to="/queue"
            :class="route.path === '/queue' ? 'nav-item-active' : 'nav-item'"
          >
            Queue
          </RouterLink>
          <RouterLink
            to="/stats"
            :class="route.path === '/stats' ? 'nav-item-active' : 'nav-item'"
          >
            Stats
          </RouterLink>
          <RouterLink
            to="/help"
            :class="route.path === '/help' ? 'nav-item-active' : 'nav-item'"
          >
            Help
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <RouterView />
    </main>

    <!-- Toast Notifications -->
    <ToastNotification />
  </div>
</template>
