import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/unit/**/*.spec.ts', 'tests/contract/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/mockData', 'dist/'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/src'),
      '@core': path.resolve(__dirname, './app/src/core'),
      '@data': path.resolve(__dirname, './app/src/data'),
      '@scenes': path.resolve(__dirname, './app/src/scenes'),
      '@ui': path.resolve(__dirname, './app/src/ui'),
      '@services': path.resolve(__dirname, './app/src/services'),
    },
  },
});
