<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header class="border-b border-gray-800">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">Sakuga</h1>
            <p class="text-xs text-gray-500">作画</p>
          </div>
        </RouterLink>

        <nav class="flex gap-1">
          <RouterLink
            to="/"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === '/' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'"
          >
            Generate
          </RouterLink>
          <RouterLink
            to="/history"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === '/history' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'"
          >
            History
          </RouterLink>
          <RouterLink
            to="/queue"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === '/queue' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'"
          >
            Queue
          </RouterLink>
          <RouterLink
            to="/stats"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === '/stats' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'"
          >
            Stats
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
