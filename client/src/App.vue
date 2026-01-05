<script setup>
import { ref, watch, onMounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import ToastNotification from './components/ToastNotification.vue';
import { useAuth } from './composables/useAuth';

const route = useRoute();
const router = useRouter();
const { user, isAuthenticated, initAuth, logout } = useAuth();
const isMobileMenuOpen = ref(false);
const showUserMenu = ref(false);

// Initialize auth on mount
onMounted(() => {
  initAuth();
});

// Close menu on route change
watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
  showUserMenu.value = false;
});

const navItems = [
  { path: '/', label: 'Generate' },
  { path: '/history', label: 'History' },
  { path: '/collections', label: 'Collections' },
  { path: '/queue', label: 'Queue' },
  { path: '/stats', label: 'Stats' },
  { path: '/settings', label: 'Settings' },
  { path: '/help', label: 'Help' }
];

async function handleLogout() {
  await logout();
  showUserMenu.value = false;
  router.push('/');
}
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
        <nav class="hidden md:flex gap-2 items-center">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="route.path === item.path ? 'nav-item-active' : 'nav-item'"
          >
            {{ item.label }}
          </RouterLink>

          <!-- User Menu -->
          <div class="relative ml-2">
            <button
              v-if="isAuthenticated"
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-neu-sm bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary transition-all duration-200"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm font-medium">{{ user?.username }}</span>
            </button>
            <RouterLink
              v-else
              to="/login"
              class="px-3 py-2 rounded-neu-sm bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-accent transition-all duration-200 text-sm font-medium"
            >
              Sign In
            </RouterLink>

            <!-- Dropdown Backdrop -->
            <div
              v-if="showUserMenu"
              @click="showUserMenu = false"
              class="fixed inset-0 z-40"
            />

            <!-- Dropdown -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-neu-surface rounded-neu-sm shadow-neu-raised-lg z-50 py-2"
            >
              <div class="px-4 py-2 border-b border-neu-border/30">
                <p class="text-sm font-medium text-text-primary">{{ user?.username }}</p>
                <p v-if="user?.email" class="text-xs text-text-muted">{{ user?.email }}</p>
              </div>
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-neu-elevated hover:text-text-primary transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
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

        <!-- Mobile Auth -->
        <div class="mt-6 pt-6 border-t border-neu-border/30">
          <div v-if="isAuthenticated" class="space-y-3">
            <div class="px-4 py-2">
              <p class="text-sm font-medium text-text-primary">{{ user?.username }}</p>
              <p v-if="user?.email" class="text-xs text-text-muted">{{ user?.email }}</p>
            </div>
            <button
              @click="handleLogout"
              class="w-full px-4 py-3 rounded-neu-sm text-base font-medium text-text-secondary hover:bg-neu-elevated hover:text-text-primary transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
          <RouterLink
            v-else
            to="/login"
            class="block px-4 py-3 rounded-neu-sm text-base font-medium text-accent hover:bg-neu-elevated transition-all duration-200"
          >
            Sign In
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
