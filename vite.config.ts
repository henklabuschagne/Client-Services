import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Allow iframe embedding - remove frame restrictions
  server: {
    headers: {
      // Allow embedding in iframes from any origin
      'X-Frame-Options': 'ALLOWALL',
      // Allow all origins to embed this app
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
  
  preview: {
    headers: {
      // Allow embedding in iframes from any origin (for preview builds)
      'X-Frame-Options': 'ALLOWALL',
      // Allow all origins to embed this app
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
})