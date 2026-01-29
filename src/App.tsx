import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/PageTransition";

import { SEO } from "@/components/SEO";
import { Analytics } from "@/components/Analytics";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { shouldRetryQuery, queryRetryDelay } from "@/lib/query-retry";

// Lazy load routes and main app for code splitting
const PromptNotes = lazy(() => import("@/components/PromptNotes"));
const AboutPage = lazy(() => import("@/components/pages/AboutPage"));
const FAQPage = lazy(() => import("@/components/pages/FAQPage"));
const UseCasesPage = lazy(() => import("@/components/pages/UseCasesPage"));
const PublicPromptView = lazy(() => import("@/components/PublicPromptView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
      staleTime: 5 * 60 * 1000,
      gcTime: 5 * 60 * 1000, // Clean up cache after 5 minutes of inactivity
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
    },
  },
});

const App = () => {
  const { t, i18n } = useTranslation();

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
            <Analytics />
            <PageTransition>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-background">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
                          </div>
                        </div>
                      }>
                        <PromptNotes />
                      </Suspense>
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
                            <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
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
                            <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
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
                            <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
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
                            <p className="text-sm text-muted-foreground">{t('app.loading')}</p>
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
