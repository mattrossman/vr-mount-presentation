import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import twindJsx from '@twind/vite-plugin-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), twindJsx()],
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
  },
  esbuild: {
    jsxInject: "import React from 'react'",
  },
  server: {
    port: 1234,
    open: true,
  },
})
