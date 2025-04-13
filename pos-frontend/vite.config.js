import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss' // <-- Import tailwindcss
import autoprefixer from 'autoprefixer' // <-- Import autoprefixer

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: { // <-- Add this css block
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  // Make sure you have the server proxy if needed for API calls later
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your backend server address
        changeOrigin: true,
        // secure: false, // Uncomment if backend is not https
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if you need to remove /api prefix for backend
      }
    }
  }
})