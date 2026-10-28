import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          // The browser may be on Arena's preview origin. Keep the API's dev CORS
          // allowlist intact by forwarding requests as the local Vite origin.
          proxy.on('proxyReq', (proxyReq) => proxyReq.setHeader('origin', 'http://localhost:5173'));
        }
      }
    }
  }
});
