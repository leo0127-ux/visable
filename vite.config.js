import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 確保 @ 別名正確指向 src
    },
  },
  server: {
    port: 5173, // Ensure this matches the expected port
    strictPort: true, // Prevent fallback to a random port
  },
});
