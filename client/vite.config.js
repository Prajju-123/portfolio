import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Env files: .env.development (npm run dev), .env.test, .env.production. The mode picks the file.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log(`🔥 Running in ${mode.toUpperCase()} mode`);
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // also reachable through the Network link (phone, other PCs on the same Wi-Fi)
      port: 5173,
      proxy: { '/api': env.VITE_PROXY_TARGET || 'http://localhost:5000' },
    },
    preview: { host: '0.0.0.0' },
  };
});
