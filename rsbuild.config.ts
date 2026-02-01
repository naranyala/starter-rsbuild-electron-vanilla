import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/renderer/index.ts',
    },
  },
  resolve: {
    alias: {
      '@': './src/renderer',
    },
  },
  html: {
    template: './src/renderer/index.html',
  },
  output: {
    distPath: {
      root: './dist',
    },
    assetPrefix: './',
  },
});
