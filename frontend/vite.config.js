import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Game Theory Auctions',
        short_name: 'GT Auctions',
        description: 'Game-theoretic auction platform with Nash equilibrium strategies',
        theme_color: '#4f6ef7',
        background_color: '#f5f7fb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:3001',
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
