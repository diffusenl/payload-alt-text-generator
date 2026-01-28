import { defineConfig } from 'tsup'

export default defineConfig([
  // Server-side code (plugin, endpoints)
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'payload', '@payloadcms/ui', /^@payloadcms\/.*/],
  },
  // Client-side components
  {
    entry: {
      'components/index': 'src/components/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: ['react', 'react-dom', 'payload', '@payloadcms/ui', /^@payloadcms\/.*/, 'next', /^next\/.*/],
    banner: {
      js: '"use client";',
    },
  },
])
