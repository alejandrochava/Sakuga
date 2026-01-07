import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/public/sw.js', // Service worker has special globals
    ],
  },

  // Base JavaScript config
  js.configs.recommended,

  // Vue files
  ...pluginVue.configs['flat/recommended'],

  // TypeScript and JavaScript files in server
  {
    files: ['server/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Will address in logging phase
      'prefer-const': 'warn', // Warn instead of error
      'no-var': 'error',
      'no-undef': 'off', // Node globals handled above
    },
  },

  // Client Vue and JavaScript files
  {
    files: ['client/src/**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'warn', // Warn instead of error
      'no-var': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/attributes-order': 'off', // Stylistic, handled by Prettier
      'vue/first-attribute-linebreak': 'off', // Stylistic preference
    },
  },

  // Config files (vite, vitest, playwright, etc.)
  {
    files: ['*.config.js', '**/vite.config.js', '**/vitest.config.js', '**/playwright.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        URL: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.spec.js', '**/*.test.js', 'e2e/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        test: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Playwright has many globals
    },
  },

  // Prettier compatibility (must be last)
  eslintConfigPrettier,
];
