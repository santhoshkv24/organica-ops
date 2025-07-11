import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This helps resolve imports from node_modules
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Add any global SCSS variables or mixins here if needed
        additionalData: `
          // Global SCSS variables can be defined here
          $primary: #6a1fdb;
          $secondary: #9da5b1;
          $light: #ebedef;
          $dark: black;
          $success: #2eb85c;
          $info: #6a1fdb;
          $warning: #f9b115;
          $danger: #e55353;
        `
      }
    }
  }
})
