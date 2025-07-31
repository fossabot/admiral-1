import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Unit tests only - fast and reliable for CI
export default defineConfig({
  // @ts-expect-error - vitest has conflicting vite types
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup-tests.ts'],
    globals: true,
    css: true,
    reporters: ['verbose'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['src/**/*.stories.{js,ts,jsx,tsx}'], // Exclude Storybook files
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    },
  },
  define: {
    global: 'globalThis',
  },
});
