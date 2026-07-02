import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://rqwhpdntgibvzpawmauq.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxd2hwZG50Z2lidnpwYXdtYXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTI3MzUsImV4cCI6MjA5ODIyODczNX0.VNU7rE6_CeeoRuG3wWBk9xfN1pdOLBRF2bEI3Gnx7zk';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please declare VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

