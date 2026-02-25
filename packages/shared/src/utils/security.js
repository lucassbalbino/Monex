/**
 * Utilidades de segurança — Monex
 * Compartilhadas entre web e mobile
 */

/**
 * Sanitiza input removendo caracteres potencialmente perigosos
 * @param {string} input
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Detecta padrões suspeitos em input
 * @param {string} input
 * @returns {boolean}
 */
export const detectSuspiciousPatterns = (input) => {
  if (!input) return false;
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /\.constructor/i,
    /__proto__/i,
  ];
  return suspiciousPatterns.some((pattern) => pattern.test(input));
};

/**
 * Valida senha com critérios mínimos
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  return { valid: errors.length === 0, errors };
};
