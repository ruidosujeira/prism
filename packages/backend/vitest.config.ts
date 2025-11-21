import { defineConfig } from 'vitest/config'
import { prismAliases } from '../../vitest.aliases'

export default defineConfig({
  resolve: {
    alias: prismAliases,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setupEnv.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
    },
  },
})
