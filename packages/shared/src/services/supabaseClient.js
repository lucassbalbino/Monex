/**
 * Supabase Client — Monex (compartilhado)
 * Funciona tanto em web (Vite) quanto mobile (Expo/React Native)
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detecta ambiente (web usa import.meta.env, mobile usa process.env)
// Nota: import.meta não é suportado pelo Hermes (React Native),
// então usamos apenas process.env que funciona em ambas plataformas.
// No Expo, variáveis EXPO_PUBLIC_* são injetadas em process.env.
// No Vite, variáveis são disponibilizadas via import.meta.env (tratado no web app).
const getEnvVar = (key) => {
  // process.env funciona tanto no Expo (EXPO_PUBLIC_*) quanto em Node
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

/**
 * Detecta se estamos no React Native (mobile) ou no browser (web)
 */
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * Storage adapter — usa AsyncStorage no mobile, localStorage no web
 */
const storageAdapter = isReactNative
  ? {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: (key) => AsyncStorage.removeItem(key),
    }
  : typeof window !== 'undefined'
  ? window.localStorage
  : undefined;

export const createSupabaseClient = (url, key, options = {}) => {
  return createClient(url || supabaseUrl, key || supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: storageAdapter,
      detectSessionInUrl: !isReactNative,
      flowType: isReactNative ? 'pkce' : 'implicit',
      ...options.auth,
    },
    ...options,
  });
};

// Instância padrão
export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null;
