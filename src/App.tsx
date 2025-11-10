import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppPage from './pages/App';
import TagPage from './pages/Tag';
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
              <Route path="/" element={<AppPage />} />
              <Route path="/tags/:name" element={<TagPage />} />
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
