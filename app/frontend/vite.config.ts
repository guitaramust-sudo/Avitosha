import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
          ws: true,
        },
        '/storage': {
          target: env.VITE_STORAGE_PROXY_TARGET || 'http://127.0.0.1:9000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/storage/, ''),
        },
      },
    },
  }
})
