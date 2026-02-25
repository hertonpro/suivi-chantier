import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true // Permet de tester la PWA même en mode développement
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          id: '/',
          name: 'Suivi de Chantier Pro',
          short_name: 'SuiviChantier',
          description: 'Application professionnelle de suivi de chantier et de travaux.',
          theme_color: '#0f172a',
          background_color: '#f8fafc',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'https://picsum.photos/192/192',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://picsum.photos/512/512',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'https://picsum.photos/1280/720',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Tableau de bord de suivi'
            },
            {
              src: 'https://picsum.photos/720/1280',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Suivi sur mobile'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR === 'true' ? false : true,
    },
  };
});
