import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // root is the frontend/ dir so `index.html` resolves correctly whether
    // Vite is invoked from the repo root (production build via npm run build)
    // or from inside frontend/ (dev).
    root: __dirname,
    plugins: [react(), tailwindcss()],
    build: {
      // Emit into frontend/dist/ so the Dockerfile's runtime stage can
      // COPY frontend/dist into the image.
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
