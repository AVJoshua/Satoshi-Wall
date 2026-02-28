import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/Satoshi-Wall/',
    plugins: [react()],
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            buffer: 'buffer',
        },
        // Force all packages to use the same React instance
        dedupe: ['react', 'react-dom'],
    },
});
