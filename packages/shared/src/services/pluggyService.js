/**
 * Pluggy Open Finance Service
 * 
 * Todas as chamadas à API do Pluggy passam pelo backend (Supabase Edge Functions)
 * para manter as credenciais seguras. O mobile NUNCA acessa a API do Pluggy diretamente.
 * 
 * Fluxo:
 * 1. createConnectToken() → gera token para o Pluggy Connect Widget
 * 2. Usuário autentica no banco via Widget → retorna itemId
 * 3. syncItem(itemId) → backend busca dados do Pluggy e salva no Supabase
 * 4. getAccounts/getTransactions/etc → lê dados já sincronizados do Supabase
 */

import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

// ─── Edge Function Proxy ────────────────────────────────────────────────────

const EDGE_FN = 'pluggy-proxy';

async function callEdgeFunction(action, payload = {}) {
  try {
    if (!supabase) throw new Error('Supabase client não inicializado. Verifique EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    // Debug: mostra URL base do Supabase para verificar a chamada
    const supabaseUrl = supabase.supabaseUrl || supabase.restUrl?.replace('/rest/v1', '') || 'unknown';
    logger.info(`[PluggyService] Chamando Edge Function: ${action} em ${supabaseUrl}/functions/v1/${EDGE_FN}`);
    logger.info(`[PluggyService] Token (primeiros 20 chars): ${session.access_token?.substring(0, 20)}...`);

    const { data, error } = await supabase.functions.invoke(EDGE_FN, {
      body: { action, ...payload },
    });

    if (error) {
      // Extrair detalhes reais do erro da Edge Function
      let details = error.message;
      try {
        if (error.context && typeof error.context.json === 'function') {
          const body = await error.context.json();
          details = JSON.stringify(body);
        } else if (error.context && typeof error.context.text === 'function') {
          details = await error.context.text();
        }
      } catch (_) { /* ignorar erro ao ler body */ }

      logger.error(`[PluggyService] ${action} — status: ${error.context?.status || '?'}, detalhes:`, details);
      throw new Error(`Edge Function "${action}" falhou (${error.context?.status || '?'}): ${details}`);
    }

    if (data?.error) throw new Error(data.error);

    return { data: data?.data ?? data, error: null };
  } catch (error) {
    logger.error(`[PluggyService] ${action}:`, error.message);
    return { data: null, error };
  }
}

// ─── Conexão / Connect Widget ───────────────────────────────────────────────

/**
 * Gera um token para abrir o Pluggy Connect Widget.
 * O token é temporário e vinculado ao usuário autenticado.
 */
export async function createConnectToken() {
  return callEdgeFunction('create-connect-token');
}

/**
 * Registra o item (conexão bancária) após o usuário completar o fluxo do Widget.
 * O backend salva o itemId e busca todos os dados iniciais.
 */
export async function registerConnection(itemId) {
  return callEdgeFunction('register-connection', { itemId });
}

/**
 * Remove uma conexão bancária (desconecta o banco).
 */
export async function removeConnection(connectionId) {
  return callEdgeFunction('remove-connection', { connectionId });
}

/**
 * Força a re-sincronização de todas as conexões do usuário.
 */
export async function syncAllConnections() {
  return callEdgeFunction('sync-all');
}

/**
 * Sincroniza uma conexão específica.
 */
export async function syncConnection(connectionId) {
  return callEdgeFunction('sync-connection', { connectionId });
}

// ─── Leitura de Dados (Supabase - já sincronizados) ────────────────────────

/**
 * Busca todas as conexões bancárias do usuário.
 */
export async function getConnections() {
  try {
    const { data, error } = await supabase
      .from('open_finance_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('[PluggyService] getConnections:', error.message);
    return { data: null, error };
  }
}

/**
 * Busca todas as contas bancárias de todas as conexões do usuário.
 */
export async function getAccounts(connectionId = null) {
  try {
    let query = supabase
      .from('open_finance_accounts')
      .select('*, open_finance_connections(institution_name, institution_logo)')
      .order('type', { ascending: true });

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('[PluggyService] getAccounts:', error.message);
    return { data: null, error };
  }
}

/**
 * Busca transações com filtros opcionais.
 * Por padrão retorna os últimos 2 meses.
 */
export async function getTransactions({ 
  connectionId = null, 
  accountId = null,
  startDate = null, 
  endDate = null,
  limit = 100,
  offset = 0,
} = {}) {
  try {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    let query = supabase
      .from('open_finance_transactions')
      .select('*, open_finance_accounts(name, type, open_finance_connections(institution_name))')
      .gte('date', (startDate || twoMonthsAgo).toISOString().split('T')[0])
      .lte('date', (endDate || now).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (connectionId) query = query.eq('connection_id', connectionId);
    if (accountId) query = query.eq('account_id', accountId);

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('[PluggyService] getTransactions:', error.message);
    return { data: null, error };
  }
}

/**
 * Busca todos os cartões de crédito de todas as conexões.
 */
export async function getCreditCards(connectionId = null) {
  try {
    let query = supabase
      .from('open_finance_credit_cards')
      .select('*, open_finance_connections(institution_name, institution_logo)')
      .order('created_at', { ascending: false });

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('[PluggyService] getCreditCards:', error.message);
    return { data: null, error };
  }
}

/**
 * Busca todas as faturas de um cartão de crédito.
 */
export async function getCreditCardBills(cardId) {
  try {
    const { data, error } = await supabase
      .from('open_finance_credit_card_bills')
      .select('*')
      .eq('card_id', cardId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('[PluggyService] getCreditCardBills:', error.message);
    return { data: null, error };
  }
}

/**
 * Busca todas as dívidas/empréstimos do usuário.
 */
export async function getLoans(connectionId = null) {
  try {
    let query = supabase
      .from('open_finance_loans')
      .select('*, open_finance_connections(institution_name, institution_logo)')
      .order('due_date', { ascending: true });

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('[PluggyService] getLoans:', error.message);
    return { data: null, error };
  }
}

/**
 * Busca o resumo consolidado de Open Finance do usuário.
 * Agrega saldos, totais de cartão, dívidas, etc.
 */
export async function getOpenFinanceSummary() {
  try {
    const [accounts, cards, loans] = await Promise.all([
      getAccounts(),
      getCreditCards(),
      getLoans(),
    ]);

    if (accounts.error) throw accounts.error;

    const totalBalance = (accounts.data || [])
      .filter(a => a.type === 'BANK')
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalCreditLimit = (cards.data || [])
      .reduce((sum, c) => sum + (c.credit_limit || 0), 0);

    const totalCreditUsed = (cards.data || [])
      .reduce((sum, c) => sum + (c.available_credit_limit 
        ? c.credit_limit - c.available_credit_limit 
        : 0), 0);

    const totalDebt = (loans.data || [])
      .reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);

    return {
      data: {
        totalBalance,
        totalCreditLimit,
        totalCreditUsed,
        totalDebt,
        accountsCount: (accounts.data || []).length,
        cardsCount: (cards.data || []).length,
        loansCount: (loans.data || []).length,
      },
      error: null,
    };
  } catch (error) {
    logger.error('[PluggyService] getOpenFinanceSummary:', error.message);
    return { data: null, error };
  }
}
