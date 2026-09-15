import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow the sandbox preview proxy host (and any other host) to reach the dev server
    allowedHosts: true,
    proxy: {
      // Same-origin API access in dev: browser → Vite → NestJS server.
      // This keeps the storefront working behind any proxy/host (no CORS pain,
      // no localhost calls from the browser to a sandbox-only port).
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
