// src/lib/logger.js
// Secure logging utility - only logs in development environment

const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[Monex] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[Monex] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    // Always log errors, but sanitize sensitive data
    console.error(`[Monex] ${message}`, ...args);
  },

  // For sensitive data that should never be logged
  secure: (message) => {
    if (isDevelopment) {
      console.log(`[Monex] ${message} (data omitted for security)`);
    }
  }
};