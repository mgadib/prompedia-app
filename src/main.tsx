import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { validateEnv } from "@/lib/env-validation";
import App from "./App.tsx";
import "./index.css";

// Validate environment variables at startup
try {
  validateEnv();
} catch (error) {
  console.error('Failed to start application:', error);
  // Error will be displayed in console with helpful messages
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
