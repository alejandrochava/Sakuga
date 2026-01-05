import { ref, computed } from 'vue';

const user = ref(null);
const token = ref(localStorage.getItem('auth_token'));
const loading = ref(false);
const error = ref(null);

// Initialize auth state on load
async function initAuth() {
  if (!token.value) return;

  try {
    loading.value = true;
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      user.value = data.user;
    } else {
      // Token is invalid
      logout();
    }
  } catch (e) {
    console.error('Auth init error:', e);
    logout();
  } finally {
    loading.value = false;
  }
}

async function login(username, password) {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    user.value = data.user;
    token.value = data.token;
    localStorage.setItem('auth_token', data.token);

    return data.user;
  } catch (e) {
    error.value = e.message;
    throw e;
  } finally {
    loading.value = false;
  }
}

async function register(username, password, email = null) {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    user.value = data.user;
    token.value = data.token;
    localStorage.setItem('auth_token', data.token);

    return data.user;
  } catch (e) {
    error.value = e.message;
    throw e;
  } finally {
    loading.value = false;
  }
}

async function logout() {
  try {
    if (token.value) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });
    }
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    user.value = null;
    token.value = null;
    localStorage.removeItem('auth_token');
  }
}

async function changePassword(currentPassword, newPassword) {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }

    // Update token
    token.value = data.token;
    localStorage.setItem('auth_token', data.token);

    return true;
  } catch (e) {
    error.value = e.message;
    throw e;
  } finally {
    loading.value = false;
  }
}

// Helper to get auth headers for API calls
function getAuthHeaders() {
  if (!token.value) return {};
  return {
    'Authorization': `Bearer ${token.value}`
  };
}

// Authenticated fetch wrapper
async function authFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };

  return fetch(url, { ...options, headers });
}

export function useAuth() {
  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isAuthenticated: computed(() => !!user.value),
    initAuth,
    login,
    register,
    logout,
    changePassword,
    getAuthHeaders,
    authFetch
  };
}
