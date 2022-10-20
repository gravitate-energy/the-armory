import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime.js',
    },
  },
  plugins: [react()],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'index',
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css' ? 'index.css' : assetInfo.name,
      },
      external: ['react', 'moment', 'react/jsx-runtime'],
    },
  },
})
