/**
 * Logger — Monex (produção: silencioso)
 * Compatível com web e mobile
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const noop = () => {};

export const logger = {
  info: isDev ? (...args) => console.log('[Monex:info]', ...args) : noop,
  warn: isDev ? (...args) => console.warn('[Monex:warn]', ...args) : noop,
  error: isDev ? (...args) => console.error('[Monex:error]', ...args) : noop,
  secure: noop, // nunca loga dados sensíveis
};
