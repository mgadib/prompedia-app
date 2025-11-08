import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { validateEnv } from "@/lib/env-validation";
import App from "./App.tsx";
import "./index.css";
import "@/lib/i18n"; // Inisialisasi i18n

// Memvalidasi variabel environment saat startup
// Validasi menggunakan graceful fallback, tidak throw error
validateEnv();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
