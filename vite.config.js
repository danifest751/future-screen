import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 4174,
    },
    build: {
        // Разделение чанков для оптимизации загрузки
        rollupOptions: {
            output: {
                manualChunks: {
                    // Отдельный чанк для React
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    // Отдельный чанк для UI библиотек
                    'ui-vendor': ['lucide-react'],
                    // Отдельный чанк для форм и валидации
                    'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
                },
            },
        },
        // Отчёт о размерах
        reportCompressedSize: true,
        chunkSizeWarningLimit: 500,
    },
});
