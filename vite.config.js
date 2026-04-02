import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/__mockup': {
                target: 'http://localhost:23636',
                changeOrigin: true,
                ws: true,
            },
        },
    },
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui-vendor': ['lucide-react'],
                    'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
                },
            },
        },
        reportCompressedSize: true,
        chunkSizeWarningLimit: 500,
    },
});
