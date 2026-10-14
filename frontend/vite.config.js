import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const previewMode = process.env.BASE44_PREVIEW_MODE === '1';
const sandboxDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // The preview proxy forwards the sandbox hostname; allow it by wildcard while
    // running in the sandbox preview only. Outside preview mode Vite keeps its
    // default host protection.
    allowedHosts: previewMode && sandboxDomain ? [`.${sandboxDomain}`] : undefined,
    // Bind-mounted sources need polling so edits are picked up reliably.
    watch: { usePolling: true, interval: 400 },
    proxy: {
      // Single origin: the marketing site and the API share host port 3000, so the
      // session cookie stays first-party.
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://api:8000',
        changeOrigin: false,
      },
      // Product images uploaded from the admin dashboard.
      '/uploads': {
        target: process.env.API_PROXY_TARGET || 'http://api:8000',
        changeOrigin: false,
      },
    },
  },
});
