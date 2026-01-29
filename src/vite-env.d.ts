/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_TIME?: string;
  readonly VITE_ANALYTICS_SCRIPT_URL?: string;
  readonly VITE_ANALYTICS_WEBSITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
