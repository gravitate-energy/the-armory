import react from '@vitejs/plugin-react'
import path from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime.development.js',
    },
  },
  plugins: [react(), dts()],
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
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        '@ag-grid-community/react',
        '@ag-grid-enterprise/all-modules',
        '@nivo/core',
        '@nivo/line',
        '@nivo/bar',
        'moment',
        'query-string',
        'google-map-react',
        'react-ga',
        'axios',
        'classnames',
        'react-lottie',
      ],
    },
  },
})
