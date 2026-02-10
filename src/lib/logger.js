// src/lib/logger.js
// Logger configurável - ativo em desenvolvimento

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Funções de log que só funcionam em desenvolvimento
const devLog = (level, ...args) => {
  if (isDev && typeof console !== 'undefined') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console[level](`[${timestamp}]`, ...args);
  }
};

export const logger = {
  info: (...args) => devLog('info', ...args),
  warn: (...args) => devLog('warn', ...args),
  error: (...args) => devLog('error', ...args),
  secure: (...args) => devLog('info', '[SECURE]', ...args),
};