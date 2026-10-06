import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://gdqdcsswwjbcbaikilmz.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_k_WtwoZtFdGGhHlbrwV5yw_JnHGZnJp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
