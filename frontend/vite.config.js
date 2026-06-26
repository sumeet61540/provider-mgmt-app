import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only convenience proxy so the Vite dev server can forward /api calls
// to the local backend without CORS friction. The production build does
// NOT use this proxy — src/api/client.js always calls VITE_API_BASE_URL
// directly, since there is no dev server (and no proxy) once this is built
// and served as static files behind Nginx.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
