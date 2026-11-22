import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwind()],
  server: { fs: { strict: true } },
  esbuild: { jsx: 'automatic' },
})
