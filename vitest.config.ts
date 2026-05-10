import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const base = path.resolve(__dirname, 'src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /@\/components\/ui\/(.+)/,
        replacement: path.join(base, 'app/components/ui', '$1'),
      },
      {
        find: /@\/components\/transaction\/(.+)/,
        replacement: path.join(base, 'app/components/transaction', '$1'),
      },
      {
        find: /@\/components\/nft\/(.+)/,
        replacement: path.join(base, 'app/components/nft', '$1'),
      },
      {
        find: /@\/components\/(.+)/,
        replacement: path.join(base, 'app/components', '$1'),
      },
      {
        find: /@\/lib\/(.+)/,
        replacement: path.join(base, 'app/lib', '$1'),
      },
      {
        find: /@\/lib/,
        replacement: path.join(base, 'app/lib'),
      },
      {
        find: /@\/hooks\/(.+)/,
        replacement: path.join(base, 'app/hooks', '$1'),
      },
      {
        find: /@\/hooks/,
        replacement: path.join(base, 'app/hooks'),
      },
      {
        find: /@\/providers\/(.+)/,
        replacement: path.join(base, 'app/providers', '$1'),
      },
      {
        find: /@\/config\/(.+)/,
        replacement: path.join(base, 'app/config', '$1'),
      },
      {
        find: /@\/types\/(.+)/,
        replacement: path.join(base, 'app/types', '$1'),
      },
      {
        find: /@\/services\/(.+)/,
        replacement: path.join(base, 'app/lib/services', '$1'),
      },
      {
        find: /@\/services/,
        replacement: path.join(base, 'app/lib/services'),
      },
      {
        find: /@\/utils\/(.+)/,
        replacement: path.join(base, 'app/lib/utils', '$1'),
      },
      {
        find: /@\/abi\/(.+)/,
        replacement: path.join(base, 'abi', '$1'),
      },
      {
        find: /@\/test\/(.+)/,
        replacement: path.join(base, 'test', '$1'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/app/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'src/contracts/**',
      'src/test/**',
    ],
    coverage: {
      exclude: ['node_modules', 'src/test/**', 'src/contracts/**'],
    },
  },
});