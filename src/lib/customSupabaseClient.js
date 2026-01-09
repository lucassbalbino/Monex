import { createClient } from '@supabase/supabase-js';




const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not defined in environment variables.');
}

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    
  }
});

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
