
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("Connecting to supabase:", supabaseUrl);
const supabase = createClient<Database>(supabaseUrl, supabaseKey);
export const workerSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
      detectSessionInUrl: false,
      persistSession: false,
  },
});

export default supabase;