// File ini dihasilkan secara otomatis. Jangan edit langsung.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Konfigurasi Supabase dari environment variables dengan fallback untuk production
// Anon key adalah public key yang aman diekspos - keamanan dijaga oleh RLS
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || 'https://kecpjbrlvaoujdnerhwe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3BqYnJsdmFvdWpkbmVyaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODQ4MDIsImV4cCI6MjA3NjU2MDgwMn0.CFBQJhZDMmfKGdg5GVeB2ns3uiojyCVQqXNvHZXpGyI';

// Import supabase client seperti ini:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});