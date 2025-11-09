import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// Konfigurasi Vite - https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: mode === 'development' ? {} : {
      // Header Content Security Policy untuk production
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kecpjbrlvaoujdnerhwe.supabase.co https://openrouter.ai",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://kecpjbrlvaoujdnerhwe.supabase.co https://openrouter.ai wss://kecpjbrlvaoujdnerhwe.supabase.co",
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
    mode === 'production' && visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - node_modules
          if (id.includes('node_modules')) {
            // React core libraries
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
              return 'react-vendor';
            }
            // Radix UI components
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor';
            }
            // Supabase
            if (id.includes('node_modules/@supabase')) {
              return 'supabase';
            }
            // i18next and related
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next') || id.includes('node_modules/i18next-browser-languagedetector')) {
              return 'i18n-vendor';
            }
            // TanStack Query
            if (id.includes('node_modules/@tanstack')) {
              return 'query-vendor';
            }
            // Lucide icons (can be large) - split by usage
            if (id.includes('node_modules/lucide-react')) {
              return 'icons-vendor';
            }
            // React Error Boundary
            if (id.includes('node_modules/react-error-boundary')) {
              return 'error-boundary';
            }
            // Zod for validation
            if (id.includes('node_modules/zod')) {
              return 'validation-vendor';
            }
            // Sonner for toasts
            if (id.includes('node_modules/sonner')) {
              return 'toast-vendor';
            }
            // Other vendor libraries
            return 'vendor';
          }
          
          // Feature-based code splitting
          // Prompts feature
          if (id.includes('/features/prompts/')) {
            if (id.includes('/components/PromptEditor')) {
              return 'prompts-editor';
            }
            if (id.includes('/components/')) {
              return 'prompts-components';
            }
            if (id.includes('/services/')) {
              return 'prompts-services';
            }
            if (id.includes('/validation/')) {
              return 'validation-prompts';
            }
            if (id.includes('/pages/')) {
              return 'prompts-pages';
            }
            return 'prompts-feature';
          }
          
          // Library feature
          if (id.includes('/features/library/')) {
            if (id.includes('/components/')) {
              return 'library-components';
            }
            return 'library-feature';
          }
          
          // Auth feature
          if (id.includes('/features/auth/')) {
            if (id.includes('/validation/')) {
              return 'validation-auth';
            }
            return 'auth-feature';
          }
          
          // Tags feature
          if (id.includes('/features/tags/')) {
            return 'tags-feature';
          }
          
          // App feature
          if (id.includes('/features/app/')) {
            if (id.includes('/pages/')) {
              return 'app-pages';
            }
            if (id.includes('/hooks/')) {
              return 'app-hooks';
            }
            return 'app-feature';
          }
          
          // Shared code
          if (id.includes('/shared/')) {
            if (id.includes('/validation/')) {
              return 'validation-shared';
            }
            if (id.includes('/components/')) {
              return 'shared-components';
            }
            if (id.includes('/hooks/')) {
              return 'shared-hooks';
            }
            if (id.includes('/pages/')) {
              return 'shared-pages';
            }
            return 'shared';
          }
          
          // Lib utilities
          if (id.includes('/lib/')) {
            if (id.includes('/lib/i18n')) {
              return 'i18n-config';
            }
            if (id.includes('/lib/validation')) {
              // Legacy validation - will be removed
              return 'validation-legacy';
            }
            return 'lib-utils';
          }
        },
        // Optimize chunk size limits
        chunkSizeWarningLimit: 1000, // 1MB warning threshold
      }
    },
    // Enable minification (esbuild is faster and already included)
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Optimize chunk loading
    chunkSizeWarningLimit: 1000,
  }
}));
