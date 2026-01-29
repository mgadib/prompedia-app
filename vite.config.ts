import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi Vite - https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  
  let componentTagger;
  
  if (isDevelopment) {
    try {
      const lovable = await import("lovable-tagger");
      componentTagger = lovable.componentTagger;
    } catch (e) {
      // Silent fail in development - lovable-tagger is optional
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      headers: isDevelopment ? {} : {
        // Header Content Security Policy untuk production
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kecpjbrlvaoujdnerhwe.supabase.co https://analytics.mgadib.cloud",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://kecpjbrlvaoujdnerhwe.supabase.co wss://kecpjbrlvaoujdnerhwe.supabase.co https://analytics.mgadib.cloud",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; '),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      }
    },
    plugins: [
      react(),
      isDevelopment && componentTagger && componentTagger(),
      // PWA plugin for service worker and offline caching
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60, // 1 hour
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        manifest: {
          name: 'Prompedia AI',
          short_name: 'Prompedia',
          description: 'Platform manajemen prompt AI untuk menyimpan, mengorganisir, dan berbagi prompt',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        // Only enable in production
        disable: isDevelopment,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Production optimizations
      minify: isProduction ? 'esbuild' : false,
      sourcemap: !isProduction,
      cssMinify: isProduction,
      cssCodeSplit: true,
      reportCompressedSize: false, // Faster builds
      // esbuild options for production
      esbuild: isProduction ? {
        drop: ['console', 'debugger'], // Remove console.* and debugger statements
        legalComments: 'none', // Remove comments
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              'lucide-react',
              'class-variance-authority',
              'clsx',
              'tailwind-merge'
            ],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-utils': ['date-fns', 'zod', 'react-hook-form', '@tanstack/react-query']
          }
        },
        // Exclude dev dependencies from bundle
        external: isProduction ? [] : [],
      },
      chunkSizeWarningLimit: 1000,
      // Tree-shaking optimizations
      target: 'esnext',
      modulePreload: {
        polyfill: false,
      },
    },
    // Define environment variables
    define: {
      // Ensure NODE_ENV is set correctly
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    },
    // Optimize dependencies
    optimizeDeps: {
      exclude: isProduction ? ['lovable-tagger'] : [],
    },
  };
});
