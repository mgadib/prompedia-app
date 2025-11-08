import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
// Import TagPage langsung untuk menghindari lazy loading delay saat navigasi
import TagPage from './pages/Tag';

const AppPage = React.lazy(() => import('./pages/App'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PublicPromptDetail = React.lazy(() => import('./pages/PublicPromptDetail'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Jangan retry pada error 4xx
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 menit
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'online',
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
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
              {/* Shared Layout dengan persistent Sidebar */}
              <Route element={<Layout />}>
                <Route path="/" element={<AppPage />} />
                {/* TagPage tidak menggunakan lazy loading untuk navigasi yang lebih smooth */}
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
