import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [react()],
    base: command === 'build' ? '/gody.vn/' : '/',
    optimizeDeps: {
        include: ['socket.io-client', 'recharts']
    }
}));
// Trigger restart
