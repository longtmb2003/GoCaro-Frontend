import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Keep SFCs, router slots and optimized dependencies on one Vue runtime.
    // Without dedupe, a stale optimize-deps graph can mix runtime instances
    // during HMR and make renderSlot() lose its current component instance.
    dedupe: ['vue'],
  },
  server: {
    // The backend serves no CORS headers, so in development requests are made
    // same-origin and proxied to it. Production points VITE_API_BASE_URL at the
    // real backend origin instead.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // The matchmaking WebSocket is same-origin in development and proxied to
      // the backend, so the browser never needs CORS or a cross-origin socket.
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
