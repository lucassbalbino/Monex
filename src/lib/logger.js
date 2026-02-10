// src/lib/logger.js
// Logger silencioso para produção

const noop = () => {};

export const logger = {
  info: noop,
  warn: noop,
  error: noop,
  secure: noop
};