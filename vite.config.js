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
    port: 5173, // 確保伺服器綁定在 5173 埠
    strictPort: true, // 如果埠被占用則報錯
  },
});
