// src/lib/logger.js
// No-op logger to avoid console usage in client bundles

const noop = () => {};

export const logger = {
  info: noop,
  warn: noop,
  error: noop,
  secure: noop
};