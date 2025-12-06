import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Define specific string replacement for the API key to prevent 'process' object conflicts
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})