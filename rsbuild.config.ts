import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  resolve: {
    alias: {
      '@': './src',
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
