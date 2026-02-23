// @monex/shared — barrel export
// Tudo que é compartilhado entre web e mobile

export { monexTheme, colors, spacing, typography, shadows } from './theme';
export { formatCurrency, formatDate, formatPlanInterval, formatPlanName } from './utils/formatters';
export { sanitizeInput, validateEmail, detectSuspiciousPatterns } from './utils/security';
export { createSupabaseClient, supabase } from './services/supabaseClient';
export { getSubscriptionInfo, cancelSubscription, reactivateSubscription, getStatusInfo } from './services/subscriptionService';
export { getClientData, getClientCreditCard, getDebts, getExpenses, getFinancialSummary, getGoals, getPayments, getSpendingLimits } from './services/clientService';
export { formatDataForLLM } from './services/formatDataForLLM';
export { logger } from './utils/logger';
export { MENU_ITEMS, FIXED_GOALS } from './constants';
