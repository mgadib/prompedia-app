import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi Vite - https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let componentTagger;
  
  if (mode === 'development') {
    try {
      const lovable = await import("lovable-tagger");
      componentTagger = lovable.componentTagger;
    } catch (e) {
      console.warn("lovable-tagger not found, skipping");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      headers: mode === 'development' ? {} : {
        // Header Content Security Policy untuk production
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kecpjbrlvaoujdnerhwe.supabase.co",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://kecpjbrlvaoujdnerhwe.supabase.co wss://kecpjbrlvaoujdnerhwe.supabase.co",
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
      mode === 'development' && componentTagger && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
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
        }
      },
      chunkSizeWarningLimit: 1000
    }
  };
});
