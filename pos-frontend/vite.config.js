import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss' // <-- Import tailwindcss
import autoprefixer from 'autoprefixer' // <-- Import autoprefixer
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],

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
    host: '0.0.0.0',
    https: true,
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