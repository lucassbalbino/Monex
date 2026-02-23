/**
 * Client Service — Monex (compartilhado)
 * CRUD de dados financeiros via Supabase
 */
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

const fetchTable = async (table, userId, extraFilters = {}) => {
  try {
    let query = supabase.from(table).select('*').eq('user_id', userId);
    Object.entries(extraFilters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    logger.error(`Erro ao buscar ${table}`, e);
    return [];
  }
};

export const getClientData = (userId) => fetchTable('profiles', userId);
export const getClientCreditCard = (userId) => fetchTable('credit_cards', userId);
export const getDebts = (userId) => fetchTable('debts', userId);
export const getExpenses = (userId) => fetchTable('expenses', userId);
export const getFinancialSummary = (userId) => fetchTable('financial_summary', userId);
export const getGoals = (userId) => fetchTable('goals', userId);
export const getPayments = (userId) => fetchTable('payments', userId);
export const getSpendingLimits = (userId) => fetchTable('spending_limits', userId);
