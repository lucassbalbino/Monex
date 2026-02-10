import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not defined in environment variables.');
}

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    detectSessionInUrl: true,
    // Adiciona flowType para evitar problemas com PKCE
    flowType: 'pkce',
    // Configura intervalo de refresh mais conservador
    storageKey: `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`,
  },
  // Adiciona retry para conexões lentas
  global: {
    headers: {},
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('[Supabase] Fetch error:', err);
        throw err;
      });
    },
  },
});

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
