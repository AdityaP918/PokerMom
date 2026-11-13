import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: '/PokerMom/',
  plugins: [preact()],
  build: {
    rollupOptions: {
      output: { entryFileNames: 'assets/app.js', assetFileNames: 'assets/app.[ext]' }
    }
  }
});
