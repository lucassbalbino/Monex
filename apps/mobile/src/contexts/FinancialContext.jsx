import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@shared/services/supabaseClient';
import { FIXED_GOALS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FinancialContext = createContext(null);

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial deve ser usado dentro de FinancialProvider');
  }
  return context;
}

export function FinancialProvider({ children }) {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    transactions: [],
    recentTransactions: [],
    goals: FIXED_GOALS,
    debts: [],
    limits: [],
    creditCards: [],
    goalsCount: 0,
    limitsCount: 0,
    debtsCount: 0,
    challengesCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setLoading(true);
    try {
      const [
        { data: transactions },
        { data: goals },
        { data: debts },
        { data: limits },
        { data: creditCards },
      ] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('spending_limits').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('*').eq('user_id', user.id),
      ]);

      const allTransactions = transactions || [];
      const income = allTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const expensesTotal = allTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const allGoals = [...FIXED_GOALS, ...(goals || []).filter((g) => !g.isDefault)];

      setFinancialData({
        balance: income - expensesTotal,
        income,
        expenses: expensesTotal,
        transactions: allTransactions,
        recentTransactions: allTransactions.slice(0, 10),
        goals: allGoals,
        debts: debts || [],
        limits: limits || [],
        creditCards: creditCards || [],
        goalsCount: allGoals.length,
        limitsCount: (limits || []).length,
        debtsCount: (debts || []).length,
        challengesCount: 0,
      });

      // Cache local
      await AsyncStorage.setItem(
        `monex_financial_${user.id}`,
        JSON.stringify({ income, expenses: expensesTotal, balance: income - expensesTotal })
      );
    } catch (e) {
      logger.error('Erro ao carregar dados financeiros', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = useCallback(
    async (tx) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase.from('expenses').insert([
          { ...tx, user_id: user.id },
        ]);
        if (error) throw error;
        await fetchData();
      } catch (e) {
        logger.error('Erro ao adicionar transação', e);
      }
    },
    [user?.id, fetchData]
  );

  const refreshData = fetchData;

  return (
    <FinancialContext.Provider
      value={{
        financialData,
        loading,
        refreshData,
        addTransaction,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}
