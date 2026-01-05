<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';

const router = useRouter();
const { login, register, loading, error } = useAuth();
const toast = useToast();

const mode = ref('login'); // 'login' or 'register'
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');

async function handleSubmit() {
  if (mode.value === 'register') {
    if (password.value !== confirmPassword.value) {
      toast.error('Passwords do not match');
      return;
    }
  }

  try {
    if (mode.value === 'login') {
      await login(username.value, password.value);
      toast.success('Logged in successfully');
    } else {
      await register(username.value, password.value, email.value || null);
      toast.success('Account created successfully');
    }
    router.push('/');
  } catch (e) {
    toast.error(e.message);
  }
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  password.value = '';
  confirmPassword.value = '';
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[70vh]">
    <div class="w-full max-w-md">
      <div class="card p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-neu-surface rounded-neu-md shadow-neu-raised mx-auto flex items-center justify-center mb-4">
            <span class="text-accent font-bold text-3xl">S</span>
          </div>
          <h1 class="text-2xl font-bold text-text-primary">
            {{ mode === 'login' ? 'Welcome Back' : 'Create Account' }}
          </h1>
          <p class="text-text-muted mt-2">
            {{ mode === 'login' ? 'Sign in to your Sakuga account' : 'Start generating amazing images' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Username</label>
            <input
              v-model="username"
              type="text"
              required
              minlength="3"
              class="input w-full"
              placeholder="Enter username"
              autocomplete="username"
            />
          </div>

          <div v-if="mode === 'register'">
            <label class="block text-sm font-medium text-text-secondary mb-2">Email (optional)</label>
            <input
              v-model="email"
              type="email"
              class="input w-full"
              placeholder="Enter email"
              autocomplete="email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              class="input w-full"
              placeholder="Enter password"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            />
          </div>

          <div v-if="mode === 'register'">
            <label class="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="6"
              class="input w-full"
              placeholder="Confirm password"
              autocomplete="new-password"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary w-full py-3"
          >
            <span v-if="loading">Loading...</span>
            <span v-else>{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-text-muted">
            {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
            <button
              @click="toggleMode"
              class="text-accent hover:underline font-medium ml-1"
            >
              {{ mode === 'login' ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>

        <div class="mt-6 pt-6 border-t border-neu-border/30 text-center">
          <button
            @click="router.push('/')"
            class="text-text-muted hover:text-text-secondary text-sm"
          >
            Continue without account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
