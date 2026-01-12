import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PromptNotes from "@/components/PromptNotes";
import PublicPromptView from "@/components/PublicPromptView";
import AboutPage from "@/components/pages/AboutPage";
import FAQPage from "@/components/pages/FAQPage";
import UseCasesPage from "@/components/pages/UseCasesPage";

import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

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
            <Routes>
              <Route path="/" element={<PromptNotes />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/use-cases" element={<UseCasesPage />} />

              <Route path="/share/:id" element={<PublicPromptView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
