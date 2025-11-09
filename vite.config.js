import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Firebase Firestore 代理配置 - 只代理Firebase相关请求
      '/google.firestore.v1.Firestore': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'https://firestore.googleapis.com');
          });
        }
      },
      // Firebase Auth 代理配置
      '/identitytoolkit.googleapis.com': {
        target: 'https://identitytoolkit.googleapis.com',
        changeOrigin: true,
        secure: false
      },
      // 只代理Firebase特定的v1路径
      '^/v1/projects/.*': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
