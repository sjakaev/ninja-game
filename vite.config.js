import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Замени 'your-repo-name' на название твоего репозитория
export default defineConfig({
  plugins: [react()],
  base: '/ninja-game/', // Замени на название твоего репо!
})
