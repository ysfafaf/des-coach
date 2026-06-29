import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Pastikan impornya bernama tailwindcss

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- Pastikan dipanggil dengan nama yang sama: tailwindcss()
  ],
})