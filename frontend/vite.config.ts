import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the Express backend
      // This makes cookies same-origin (5173 → 5173/api → 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('[vite-proxy] error:', err));
          // Rewrite cookie Path so it works with Vite proxy (cookies set at 5000/api/v1/auth
          // need to be sent back to 5173/api/v1/auth by the browser)
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map((cookie: string) =>
                cookie
                  .replace(/; secure/gi, '')  // remove Secure in dev (HTTP only)
                  .replace(/SameSite=Strict/gi, 'SameSite=Lax') // relax for proxy
              );
            }
          });
        },
      },
    },
  },
})
