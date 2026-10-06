import { defineConfig } from 'vite';

export default defineConfig({
  // Importamos los .glsl/.frag/.vert como strings crudos con `?raw`,
  // así no necesitamos un plugin extra para los shaders.
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Three es pesado y estable: va en su propio chunk cacheable.
        manualChunks: { three: ['three'], gsap: ['gsap'] },
      },
    },
  },
});
