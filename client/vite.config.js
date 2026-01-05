import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    vue(),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024 // Only compress files > 1KB
    }),
    // Brotli compression (better compression ratio)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Increase chunk warning limit
    chunkSizeWarningLimit: 500,
    // Minification
    minify: 'esbuild',
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps for production (optional, disable for smaller builds)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vue core in its own chunk
          'vue-vendor': ['vue', 'vue-router'],
        },
        // Asset file naming with hash for cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue', 'vue-router']
  }
});
