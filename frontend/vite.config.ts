import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',             // <-- add this so built asset URLs are relative
  plugins: [react()],
  server: {
    port: 5173,
  },
})
