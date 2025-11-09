import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import Layout from "@/shared/components/Layout";

// Lazy load all route components for better code splitting
const AppPage = React.lazy(() => import('./pages/App'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PublicPromptDetail = React.lazy(() => import('./pages/PublicPromptDetail'));
const TagPage = React.lazy(() => import('./pages/Tag'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Jangan retry pada error 4xx
        if (error && typeof error === 'object' && 'status' in error) {
          const status = typeof (error as { status?: unknown }).status === 'number' 
            ? (error as { status: number }).status 
            : null;
          if (status !== null && status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // OPTIMIZED: Increased staleTime for better caching
      staleTime: 10 * 60 * 1000, // 10 menit - data dianggap fresh lebih lama
      // OPTIMIZED: Garbage collection time - keep unused data in cache
      gcTime: 30 * 60 * 1000, // 30 menit (previously cacheTime)
      refetchOnWindowFocus: false, // Tidak refetch saat window focus untuk mengurangi requests
      refetchOnMount: false, // Gunakan cache jika data masih fresh
      refetchOnReconnect: true, // Refetch saat reconnect untuk sync data
      networkMode: 'online',
      // OPTIMIZED: Enable request deduplication
      structuralSharing: true,
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            }
          >
            <Routes>
              {/* Shared Layout dengan persistent Sidebar */}
              <Route element={<Layout />}>
                <Route path="/" element={<AppPage />} />
                <Route path="/tags/:name" element={<TagPage />} />
              </Route>
              {/* Routes tanpa layout (untuk halaman detail yang mungkin perlu layout berbeda) */}
              <Route path="/p/:id" element={<PublicPromptDetail />} />
              {/* TAMBAHKAN SEMUA ROUTE CUSTOM DI ATAS ROUTE CATCH-ALL "*" */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
