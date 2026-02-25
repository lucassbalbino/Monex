/**
 * Subscription Service — Monex (compartilhado)
 * Gerenciamento de assinatura Stripe via Supabase Edge Functions
 */
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Busca informações da assinatura do usuário
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getSubscriptionInfo = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_plan, subscription_end_date, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    logger.error('Erro ao buscar assinatura', e);
    return null;
  }
};

/**
 * Cancela a assinatura do usuário
 * @param {string} userId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const cancelSubscription = async (userId) => {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { userId, action: 'cancel' },
    });
    if (error) throw error;
    return { success: true, message: 'Assinatura cancelada com sucesso' };
  } catch (e) {
    logger.error('Erro ao cancelar assinatura', e);
    return { success: false, message: 'Erro ao cancelar assinatura' };
  }
};

/**
 * Reativa a assinatura do usuário
 * @param {string} userId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const reactivateSubscription = async (userId) => {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { userId, action: 'reactivate' },
    });
    if (error) throw error;
    return { success: true, message: 'Assinatura reativada com sucesso' };
  } catch (e) {
    logger.error('Erro ao reativar assinatura', e);
    return { success: false, message: 'Erro ao reativar assinatura' };
  }
};

/**
 * Retorna informações visuais do status da assinatura
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
export const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'Ativa', color: '#22C55E' },
    trialing: { label: 'Período de Teste', color: '#3B82F6' },
    canceled: { label: 'Cancelada', color: '#EF4444' },
    past_due: { label: 'Pagamento Pendente', color: '#F59E0B' },
    unpaid: { label: 'Não Paga', color: '#EF4444' },
    incomplete: { label: 'Incompleta', color: '#F59E0B' },
  };
  return statusMap[status] || { label: status || 'Desconhecido', color: '#64748B' };
};
