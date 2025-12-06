import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cast process to any to handle potential missing type definitions for Node.js process
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Default base '/' is best for Vercel root deployments
    define: {
      // Safely replace API key
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Define NODE_ENV to prevent libraries checking process.env.NODE_ENV from crashing
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  }
})