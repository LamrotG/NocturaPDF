import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
   build: {
    sourcemap: true,
  },
  // Relative asset paths so the built dist/index.html works when loaded via
  // file://, not just from a server root.
  base: "./",
  // Enable HTML5 history API fallback so refreshing /reader, /app, etc. works
  // without the server returning 404.
  server: {
    historyApiFallback: true,
  },
  plugins: [react()],
})