import { ref, watch } from 'vue';

/**
 * Reactive localStorage composable
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {Ref} Reactive reference synced with localStorage
 */
export function useLocalStorage(key, defaultValue) {
  const data = ref(loadFromStorage(key, defaultValue));

  watch(data, (value) => {
    saveToStorage(key, value);
  }, { deep: true });

  return data;
}

function loadFromStorage(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Remove a key from localStorage
 * @param {string} key - localStorage key to remove
 */
export function removeFromStorage(key) {
  localStorage.removeItem(key);
}
