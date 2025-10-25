import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key] || fallback;
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    console.error('Available env:', import.meta.env);
  }
  return value || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://0ec90b57d6e95fcbda19832f.supabase.co');
const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw'
);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the dev server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
