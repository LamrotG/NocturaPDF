import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built dist/index.html works when loaded via
  // file:// in the packaged Electron app, not just from a server root.
  base: "./",
  plugins: [react()],
})
