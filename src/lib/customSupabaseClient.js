import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug em produção - remova depois de resolver
if (typeof window !== 'undefined') {
  console.log('[Supabase Config] URL definida:', !!supabaseUrl);
  console.log('[Supabase Config] Key definida:', !!supabaseAnonKey);
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Variáveis de ambiente não encontradas!');
    console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl);
    // Não lança erro para evitar crash - apenas loga
}

// Configuração simplificada e robusta para produção
const customSupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
      // Usa 'implicit' que é mais compatível com diferentes hosts
      flowType: 'implicit',
    },
  }
);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
