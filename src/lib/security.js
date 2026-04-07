// src/lib/security.js
// Security utilities and configurations
// NOTA: O rate limiting abaixo é client-side (in-memory) e serve apenas como
// proteção superficial na camada do navegador. Para proteção real contra abuso,
// implemente rate limiting server-side (ex: Supabase Edge Functions, Redis, etc.).

// Rate limiting configuration (client-side only — não substitui proteção server-side)
export const rateLimitConfig = {
  // Maximum requests per minute per IP
  maxRequestsPerMinute: 60,
  // Window size in milliseconds
  windowMs: 60 * 1000,
  // Block duration after exceeding limit (5 minutes)
  blockDurationMs: 5 * 60 * 1000
};

// Input validation utilities
export const securityUtils = {
  // Sanitize user input to prevent XSS
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check for suspicious patterns in input
  containsSuspiciousPatterns: (input) => {
    if (typeof input !== 'string') return false;
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /document\./i,
      /window\./i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(input));
  },

  // Rate limiting storage (client-side — para proteção real, use Redis ou similar no servidor)
  rateLimitStore: new Map(),

  // Check if request should be rate limited
  checkRateLimit: (identifier) => {
    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;

    if (!securityUtils.rateLimitStore.has(identifier)) {
      securityUtils.rateLimitStore.set(identifier, []);
    }

    const requests = securityUtils.rateLimitStore.get(identifier);
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);

    if (validRequests.length >= rateLimitConfig.maxRequestsPerMinute) {
      return { allowed: false, remainingTime: rateLimitConfig.blockDurationMs };
    }

    validRequests.push(now);
    securityUtils.rateLimitStore.set(identifier, validRequests);

    return { allowed: true, remainingRequests: rateLimitConfig.maxRequestsPerMinute - validRequests.length };
  }
};

// Content Security Policy headers (for server-side implementation)
export const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co",
    "frame-src https://js.stripe.com https://hooks.stripe.com"
  ].join('; ')
};