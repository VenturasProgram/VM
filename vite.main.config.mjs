import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {join} from 'path';

// https://vitejs.dev/config
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        minify: false, // Desative a minificação para evitar o erro 'w'
        rollupOptions: {
            external: [
                'electron',
                'music-metadata',
                'electron-squirrel-startup',
                '@xhayper/discord-rpc',
                'react-dom',
            ]
        }
    }
});
