/**
 * Supabase Client — Monex (compartilhado)
 * Funciona tanto em web (Vite) quanto mobile (Expo/React Native)
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detecta ambiente (web usa import.meta.env, mobile usa process.env ou expo constants)
const getEnvVar = (key) => {
  // Expo / React Native
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Vite (web)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
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
