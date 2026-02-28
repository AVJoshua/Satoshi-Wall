import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config';

export default defineConfig({
    base: '/Satoshi-Wall/',
    plugins: [react()],
    css: {
        postcss: {
            plugins: [
                tailwindcss(tailwindConfig),
                autoprefixer(),
            ],
        },
    },
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            buffer: 'buffer',
        },
        dedupe: ['react', 'react-dom'],
    },
});
