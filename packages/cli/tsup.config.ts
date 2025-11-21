import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: true,
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
})
