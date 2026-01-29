import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  resolve: {
    alias: {
      '@': './src',
      '@/lib': './lib',
    },
  },
  html: {
    template: './src/index.html',
  },
  output: {
    distPath: {
      root: './dist',
    },
  },
});
