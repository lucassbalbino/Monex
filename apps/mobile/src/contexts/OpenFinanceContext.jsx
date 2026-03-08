/**
 * OpenFinanceContext
 * 
 * Gerencia o estado de todas as conexões bancárias Open Finance (Pluggy).
 * Modo READ-ONLY: apenas leitura de contas, saldos, transações, cartões e dívidas.
 * 
 * Cache local via AsyncStorage para acesso offline.
 * Sincronização automática ao montar e sob demanda.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { logger } from '@shared/utils/logger';
import {
  createConnectToken,
  registerConnection,
  removeConnection,
  syncAllConnections,
  syncConnection,
  getConnections,
  getAccounts,
  getTransactions,
  getCreditCards,
  getCreditCardBills,
  getLoans,
  getOpenFinanceSummary,
} from '@shared/services/pluggyService';

// ─── Cache Keys ─────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  connections: '@monex:of_connections',
  accounts: '@monex:of_accounts',
  transactions: '@monex:of_transactions',
  creditCards: '@monex:of_credit_cards',
  loans: '@monex:of_loans',
  summary: '@monex:of_summary',
  lastSync: '@monex:of_last_sync',
};

async function saveToCache(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    logger.warn('[OF Cache] Erro ao salvar:', e.message);
  }
}

async function loadFromCache(key, maxAgeMs = 30 * 60 * 1000) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAgeMs) return null;
    return data;
  } catch (e) {
    logger.warn('[OF Cache] Erro ao ler:', e.message);
    return null;
  }
}

async function clearAllCache() {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  } catch (e) {
    logger.warn('[OF Cache] Erro ao limpar:', e.message);
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const OpenFinanceContext = createContext(null);

export function useOpenFinance() {
  const context = useContext(OpenFinanceContext);
  if (!context) {
    throw new Error('useOpenFinance deve ser usado dentro de OpenFinanceProvider');
  }
  return context;
}

export function OpenFinanceProvider({ children }) {
  const { user } = useAuth();

  // State
  const [connections, setConnections] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);

  // Loading states (granulares para UI responsiva)
  const [loading, setLoading] = useState({
    initial: true,
    connections: false,
    accounts: false,
    transactions: false,
    creditCards: false,
    loans: false,
    syncing: false,
    connecting: false,
  });

  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const setLoadingKey = useCallback((key, value) => {
    if (mountedRef.current) {
      setLoading(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  const safeSetState = useCallback((setter, value) => {
    if (mountedRef.current) setter(value);
  }, []);

  // ─── Fetch Individual ───────────────────────────────────────────────────

  const fetchConnections = useCallback(async (useCache = true) => {
    setLoadingKey('connections', true);
    try {
      if (useCache) {
        const cached = await loadFromCache(CACHE_KEYS.connections);
        if (cached) { safeSetState(setConnections, cached); setLoadingKey('connections', false); return; }
      }
      const { data, error } = await getConnections();
      if (error) throw error;
      safeSetState(setConnections, data || []);
      await saveToCache(CACHE_KEYS.connections, data || []);
    } catch (e) {
      logger.error('[OF] fetchConnections:', e.message);
      safeSetState(setError, e.message);
    } finally {
      setLoadingKey('connections', false);
    }
  }, [setLoadingKey, safeSetState]);

  const fetchAccounts = useCallback(async (useCache = true) => {
    setLoadingKey('accounts', true);
    try {
      if (useCache) {
        const cached = await loadFromCache(CACHE_KEYS.accounts);
        if (cached) { safeSetState(setAccounts, cached); setLoadingKey('accounts', false); return; }
      }
      const { data, error } = await getAccounts();
      if (error) throw error;
      safeSetState(setAccounts, data || []);
      await saveToCache(CACHE_KEYS.accounts, data || []);
    } catch (e) {
      logger.error('[OF] fetchAccounts:', e.message);
    } finally {
      setLoadingKey('accounts', false);
    }
  }, [setLoadingKey, safeSetState]);

  const fetchTransactions = useCallback(async (filters = {}, useCache = true) => {
    setLoadingKey('transactions', true);
    try {
      if (useCache && !filters.accountId && !filters.connectionId) {
        const cached = await loadFromCache(CACHE_KEYS.transactions, 15 * 60 * 1000);
        if (cached) { safeSetState(setTransactions, cached); setLoadingKey('transactions', false); return; }
      }
      const { data, error } = await getTransactions(filters);
      if (error) throw error;
      safeSetState(setTransactions, data || []);
      if (!filters.accountId && !filters.connectionId) {
        await saveToCache(CACHE_KEYS.transactions, data || []);
      }
    } catch (e) {
      logger.error('[OF] fetchTransactions:', e.message);
    } finally {
      setLoadingKey('transactions', false);
    }
  }, [setLoadingKey, safeSetState]);

  const fetchCreditCards = useCallback(async (useCache = true) => {
    setLoadingKey('creditCards', true);
    try {
      if (useCache) {
        const cached = await loadFromCache(CACHE_KEYS.creditCards);
        if (cached) { safeSetState(setCreditCards, cached); setLoadingKey('creditCards', false); return; }
      }
      const { data, error } = await getCreditCards();
      if (error) throw error;
      safeSetState(setCreditCards, data || []);
      await saveToCache(CACHE_KEYS.creditCards, data || []);
    } catch (e) {
      logger.error('[OF] fetchCreditCards:', e.message);
    } finally {
      setLoadingKey('creditCards', false);
    }
  }, [setLoadingKey, safeSetState]);

  const fetchLoans = useCallback(async (useCache = true) => {
    setLoadingKey('loans', true);
    try {
      if (useCache) {
        const cached = await loadFromCache(CACHE_KEYS.loans);
        if (cached) { safeSetState(setLoans, cached); setLoadingKey('loans', false); return; }
      }
      const { data, error } = await getLoans();
      if (error) throw error;
      safeSetState(setLoans, data || []);
      await saveToCache(CACHE_KEYS.loans, data || []);
    } catch (e) {
      logger.error('[OF] fetchLoans:', e.message);
    } finally {
      setLoadingKey('loans', false);
    }
  }, [setLoadingKey, safeSetState]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data, error } = await getOpenFinanceSummary();
      if (error) throw error;
      safeSetState(setSummary, data);
      await saveToCache(CACHE_KEYS.summary, data);
    } catch (e) {
      logger.error('[OF] fetchSummary:', e.message);
    }
  }, [safeSetState]);

  // ─── Carregar Todos os Dados ────────────────────────────────────────────

  const loadAllData = useCallback(async (useCache = true) => {
    setLoadingKey('initial', true);
    safeSetState(setError, null);
    try {
      await fetchConnections(useCache);
      await Promise.all([
        fetchAccounts(useCache),
        fetchTransactions({}, useCache),
        fetchCreditCards(useCache),
        fetchLoans(useCache),
        fetchSummary(),
      ]);
    } catch (e) {
      logger.error('[OF] loadAllData:', e.message);
      safeSetState(setError, 'Erro ao carregar dados do Open Finance');
    } finally {
      setLoadingKey('initial', false);
    }
  }, [fetchConnections, fetchAccounts, fetchTransactions, fetchCreditCards, fetchLoans, fetchSummary, setLoadingKey, safeSetState]);

  // ─── Ações ──────────────────────────────────────────────────────────────

  /**
   * Gera token para abrir o Pluggy Connect Widget
   */
  const getConnectToken = useCallback(async () => {
    setLoadingKey('connecting', true);
    try {
      const { data, error } = await createConnectToken();
      if (error) throw error;
      return { token: data?.accessToken || data, error: null };
    } catch (e) {
      logger.error('[OF] getConnectToken:', e.message);
      return { token: null, error: e.message };
    } finally {
      setLoadingKey('connecting', false);
    }
  }, [setLoadingKey]);

  /**
   * Registra nova conexão após Widget retornar itemId
   */
  const addConnection = useCallback(async (itemId) => {
    setLoadingKey('connecting', true);
    safeSetState(setError, null);
    try {
      const { data, error } = await registerConnection(itemId);
      if (error) throw error;
      // Recarrega tudo sem cache para pegar dados novos
      await loadAllData(false);
      return { data, error: null };
    } catch (e) {
      logger.error('[OF] addConnection:', e.message);
      safeSetState(setError, 'Erro ao conectar banco');
      return { data: null, error: e.message };
    } finally {
      setLoadingKey('connecting', false);
    }
  }, [loadAllData, setLoadingKey, safeSetState]);

  /**
   * Remove uma conexão bancária
   */
  const deleteConnection = useCallback(async (connectionId) => {
    try {
      const { error } = await removeConnection(connectionId);
      if (error) throw error;
      safeSetState(setConnections, prev => prev.filter(c => c.id !== connectionId));
      await loadAllData(false);
      return { error: null };
    } catch (e) {
      logger.error('[OF] deleteConnection:', e.message);
      return { error: e.message };
    }
  }, [loadAllData, safeSetState]);

  /**
   * Sincroniza todas as conexões (pull de dados atualizados)
   */
  const refreshAll = useCallback(async () => {
    setLoadingKey('syncing', true);
    try {
      await syncAllConnections();
      await loadAllData(false);
      await AsyncStorage.setItem(CACHE_KEYS.lastSync, new Date().toISOString());
    } catch (e) {
      logger.error('[OF] refreshAll:', e.message);
      safeSetState(setError, 'Erro ao sincronizar');
    } finally {
      setLoadingKey('syncing', false);
    }
  }, [loadAllData, setLoadingKey, safeSetState]);

  /**
   * Sincroniza uma conexão específica
   */
  const refreshConnection = useCallback(async (connectionId) => {
    setLoadingKey('syncing', true);
    try {
      await syncConnection(connectionId);
      await loadAllData(false);
    } catch (e) {
      logger.error('[OF] refreshConnection:', e.message);
    } finally {
      setLoadingKey('syncing', false);
    }
  }, [loadAllData, setLoadingKey]);

  /**
   * Busca faturas de um cartão específico
   */
  const fetchCardBills = useCallback(async (cardId) => {
    try {
      const { data, error } = await getCreditCardBills(cardId);
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (e) {
      logger.error('[OF] fetchCardBills:', e.message);
      return { data: [], error: e.message };
    }
  }, []);

  /**
   * Busca transações filtradas (para telas de detalhe)
   */
  const fetchFilteredTransactions = useCallback(async (filters) => {
    try {
      const { data, error } = await getTransactions(filters);
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (e) {
      logger.error('[OF] fetchFilteredTransactions:', e.message);
      return { data: [], error: e.message };
    }
  }, []);

  // ─── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    if (user) {
      loadAllData(true);
    } else {
      // Limpa tudo ao deslogar
      setConnections([]);
      setAccounts([]);
      setTransactions([]);
      setCreditCards([]);
      setLoans([]);
      setSummary(null);
      clearAllCache();
      setLoading(prev => ({ ...prev, initial: false }));
    }
    return () => { mountedRef.current = false; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Computed Values ────────────────────────────────────────────────────

  const hasConnections = connections.length > 0;
  const isLoading = loading.initial || loading.syncing;
  const isAnyLoading = Object.values(loading).some(Boolean);

  // ─── Context Value ──────────────────────────────────────────────────────

  const value = {
    // Data
    connections,
    accounts,
    transactions,
    creditCards,
    loans,
    summary,

    // Status
    loading,
    error,
    hasConnections,
    isLoading,
    isAnyLoading,

    // Actions
    getConnectToken,
    addConnection,
    deleteConnection,
    refreshAll,
    refreshConnection,
    fetchCardBills,
    fetchFilteredTransactions,
    fetchTransactions,
    loadAllData,
  };

  return (
    <OpenFinanceContext.Provider value={value}>
      {children}
    </OpenFinanceContext.Provider>
  );
}
