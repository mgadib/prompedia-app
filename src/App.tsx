import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import PromptNotes from "@/components/PromptNotes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/PageTransition";

import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

// Lazy load routes for code splitting
const AboutPage = lazy(() => import("@/components/pages/AboutPage"));
const FAQPage = lazy(() => import("@/components/pages/FAQPage"));
const UseCasesPage = lazy(() => import("@/components/pages/UseCasesPage"));
const PublicPromptView = lazy(() => import("@/components/PublicPromptView"));

// Custom retry function with exponential backoff for rate limiting
const retryWithBackoff = (failureCount: number, error: unknown): boolean => {
  // Check if it's a rate limit error (429)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status === 429) {
      // Retry up to 3 times with exponential backoff for rate limits
      return failureCount < 3;
    }
    // Don't retry client errors (4xx except 429)
    if (status >= 400 && status < 500) {
      return false;
    }
  }
  // Retry server errors (5xx) up to 2 times
  return failureCount < 2;
};

// Calculate delay with exponential backoff
const retryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000); // Max 30 seconds
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryWithBackoff,
      retryDelay: retryDelay,
      staleTime: 5 * 60 * 1000,
      gcTime: 5 * 60 * 1000, // Clean up cache after 5 minutes of inactivity
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: retryWithBackoff,
      retryDelay: retryDelay,
    },
  },
});

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || 'id';
  }, [i18n.resolvedLanguage]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <SEO />
            <PageTransition>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary>
                      <PromptNotes />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/about" 
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-background">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          </div>
                        </div>
                      }>
                        <AboutPage />
                      </Suspense>
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/faq" 
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-background">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          </div>
                        </div>
                      }>
                        <FAQPage />
                      </Suspense>
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/use-cases" 
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-background">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          </div>
                        </div>
                      }>
                        <UseCasesPage />
                      </Suspense>
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/share/:id" 
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-background">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          </div>
                        </div>
                      }>
                        <PublicPromptView />
                      </Suspense>
                    </ErrorBoundary>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
