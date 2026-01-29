import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import { HelmetProvider } from 'react-helmet-async';
// Fonts are loaded via Google Fonts CDN in index.html
import { initSentry } from "./lib/sentry";
import { initWebVitalsTracking } from "./lib/performance-monitor";
import "./i18n";
import "./index.css";

// Initialize Sentry for error tracking (production only)
initSentry();

// Initialize Web Vitals tracking (production only)
initWebVitalsTracking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
