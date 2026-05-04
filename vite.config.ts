import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // GHSA-67mh-4wv8-2f99: esbuild dev 서버가 모든 오리진의 요청을 허용하는 취약점 완화
    cors: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
})
