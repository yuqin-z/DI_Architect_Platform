import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DI_Architect_Platform/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
