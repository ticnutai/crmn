import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5200,
    proxy: {
      '/api': {
        target: 'http://localhost:5201',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})