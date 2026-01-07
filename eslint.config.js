import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
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
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Will address in logging phase
      'prefer-const': 'error',
      'no-var': 'error',
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
      'prefer-const': 'error',
      'no-var': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/attributes-order': 'off', // Stylistic, handled by Prettier
      'vue/first-attribute-linebreak': 'off', // Stylistic preference
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
      },
    },
  },

  // Prettier compatibility (must be last)
  eslintConfigPrettier,
];
