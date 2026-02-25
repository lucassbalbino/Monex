/**
 * Supabase Client — Monex (compartilhado)
 * Funciona tanto em web (Vite) quanto mobile (Expo/React Native)
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detecta ambiente (web usa import.meta.env, mobile usa process.env)
// No Expo SDK 49+, variáveis EXPO_PUBLIC_* são injetadas em process.env pelo babel.
// No Vite, variáveis são disponibilizadas via import.meta.env (tratado no web app separadamente).
const getEnvVar = (key) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

/**
 * Detecta se estamos no React Native (mobile) ou no browser (web)
 */
const isReactNative =
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * Storage adapter — usa AsyncStorage no mobile, localStorage no web
 */
let storageAdapter;
if (isReactNative) {
  storageAdapter = {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  };
} else if (typeof window !== 'undefined' && window.localStorage) {
  storageAdapter = window.localStorage;
} else {
  storageAdapter = undefined;
}

export const createSupabaseClient = (url, key, options = {}) => {
  if (!url || !key) {
    console.warn('[Supabase] URL ou Anon Key ausentes. Cliente não criado.');
    return null;
  }
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: storageAdapter,
      detectSessionInUrl: !isReactNative,
      flowType: isReactNative ? 'pkce' : 'implicit',
      ...options.auth,
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    ...options,
  });
};

// Instância padrão
export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log para debug (removível em produção)
if (!supabase) {
  console.warn(
    '[Supabase] Cliente não inicializado. Verifique as variáveis de ambiente:',
    { EXPO_PUBLIC_SUPABASE_URL: !!supabaseUrl, EXPO_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey }
  );
}
