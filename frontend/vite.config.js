import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8000'),
      'process.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || 'ws://localhost:8000'),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        }
      }
    },
    build: {
      outDir: '../backend/staticfiles/dist',
      emptyOutDir: true,
    }
  }
})