import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://uvmxieediebczfgxcnxw.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
