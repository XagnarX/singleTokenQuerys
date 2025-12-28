import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
    plugins: [vue()],
    server: {
        host: '0.0.0.0',
        port: 10103,
        open: true,
        allowedHosts: ['localhost', 'tkana.vip.cpolar.cn', 'api.local']
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
});
