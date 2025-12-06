import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: './', // Use relative base path to ensure assets load correctly on Vercel
    define: {
      // Define global to window to prevent 'global is not defined' errors in browser from GenAI SDK
      global: 'window',
      // Define specific string replacement for the API key safely
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})