import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Existing alias for src
      '/src': path.resolve(__dirname, './src'), // Add alias for /src
    },
  },
  build: {
    outDir: 'dist', // Ensure output directory is dist
    rollupOptions: {
      input: './index.html', // Ensure entry file is correct
    },
  },
});
