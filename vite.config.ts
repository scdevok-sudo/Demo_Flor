import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Solo para probar el layout sin tocar Supabase: VITE_MOCK=true npm run dev
      ...(process.env.VITE_MOCK === 'true'
        ? [{ find: '@/lib/supabase', replacement: fileURLToPath(new URL('./dev-mock/supabase-mock.ts', import.meta.url)) }]
        : []),
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
