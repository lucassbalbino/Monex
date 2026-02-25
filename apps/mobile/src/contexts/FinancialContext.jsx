import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

// Helper para parse de data local sem timezone offset
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function FinancialProvider({ children }) {
  const { user } = useAuth();
  const initRef = useRef(false);

  // --- State (espelho do web) ---
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [spendingLimits, setSpendingLimits] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Stats calculados ---
  const [stats, setStats] = useState({ balance: 0, income: 0, expenses: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ balance: 0, income: 0, expenses: 0 });

  // --- Cálculo de stats quando transações mudam ---
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lifetime = { balance: 0, income: 0, expenses: 0 };
    const monthly = { balance: 0, income: 0, expenses: 0 };

    transactions.forEach((t) => {
      const amount = parseFloat(t.amount) || 0;
      const tDate = parseDate(t.date);

      if (t.type === 'income') {
        lifetime.balance += amount;
        lifetime.income += amount;
      } else {
        lifetime.balance -= amount;
        lifetime.expenses += amount;
      }

      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        if (t.type === 'income') {
          monthly.income += amount;
        } else {
          monthly.expenses += amount;
        }
      }
    });

    monthly.balance = monthly.income - monthly.expenses;
    setStats(lifetime);
    setMonthlyStats(monthly);
  }, [transactions]);

  // --- Fetch completo do Supabase ---
  const fetchData = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setLoading(true);
    try {
      const [
        { data: txData, error: txErr },
        { data: goalsData, error: goalsErr },
        { data: debtsData, error: debtsErr },
        { data: limitsData, error: limitsErr },
        { data: cardsData, error: cardsErr },
        { data: profileData, error: profileErr },
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('spending_limits').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      if (txErr) logger.error('Erro ao buscar transactions:', txErr.message);
      if (goalsErr) logger.error('Erro ao buscar goals:', goalsErr.message);
      if (debtsErr) logger.error('Erro ao buscar debts:', debtsErr.message);
      if (limitsErr) logger.error('Erro ao buscar spending_limits:', limitsErr.message);
      if (cardsErr) logger.error('Erro ao buscar credit_cards:', cardsErr.message);
      if (profileErr && profileErr.code !== 'PGRST116') logger.error('Erro ao buscar profile:', profileErr.message);

      setTransactions(txData || []);

      // Merge metas fixas + remotas (mesmo padrão da web)
      const remoteGoals = goalsData || [];
      const normalize = (s) => (s || '').trim().toLowerCase();
      const hasEmergency = remoteGoals.some((g) => g.isFixed && normalize(g.name) === normalize(FIXED_GOALS[0].name));
      const hasInvestment = remoteGoals.some((g) => g.isFixed && normalize(g.name) === normalize(FIXED_GOALS[1].name));
      const mergedGoals = [...remoteGoals];
      if (!hasEmergency) mergedGoals.unshift({ ...FIXED_GOALS[0] });
      if (!hasInvestment) mergedGoals.push({ ...FIXED_GOALS[1] });
      setGoals(mergedGoals);

      setDebts(debtsData || []);
      setSpendingLimits(limitsData || []);
      setCreditCards(cardsData || []);

      if (profileData) {
        setUserProfile({
          ...profileData,
          name: profileData.full_name || '',
          isSubscribed:
            profileData.subscription_status === 'active' ||
            profileData.subscription_status === 'trialing',
        });
      }

      // Cache local para offline
      try {
        await AsyncStorage.setItem(
          `monex_financial_${user.id}`,
          JSON.stringify({
            transactions: txData || [],
            goals: mergedGoals,
            debts: debtsData || [],
            limits: limitsData || [],
            creditCards: cardsData || [],
          })
        );
      } catch (_) {}
    } catch (e) {
      logger.error('Erro ao carregar dados financeiros', e);

      // Tenta carregar do cache offline
      try {
        const cached = await AsyncStorage.getItem(`monex_financial_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setTransactions(parsed.transactions || []);
          setGoals(parsed.goals || []);
          setDebts(parsed.debts || []);
          setSpendingLimits(parsed.limits || []);
          setCreditCards(parsed.creditCards || []);
        }
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // --- Carregar dados na montagem e quando user mudar ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Realtime subscriptions para sincronizar com a web ---
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase
      .channel('mobile-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spending_limits', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchData]);

  // ============================================================
  // CRUD Operations (espelham as operações da web)
  // ============================================================

  // --- Transactions ---
  const addTransaction = useCallback(
    async (tx) => {
      if (!user?.id || !supabase) return;
      try {
        const newTx = {
          ...tx,
          user_id: user.id,
          amount: parseFloat(tx.amount),
        };
        // Remove id local se existir
        const { id, ...txData } = newTx;

        const { error } = await supabase.from('transactions').insert([txData]);
        if (error) throw error;

        // Atualiza estado local imediatamente
        setTransactions((prev) => [txData, ...prev]);
      } catch (e) {
        logger.error('Erro ao adicionar transação', e);
        throw e;
      }
    },
    [user?.id]
  );

  const addTransactions = useCallback(
    async (newTransactions) => {
      if (!user?.id || !supabase) return;
      try {
        const processed = newTransactions.map((t) => ({
          ...t,
          user_id: user.id,
          amount: parseFloat(t.amount),
        }));
        const { error } = await supabase.from('transactions').insert(processed);
        if (error) throw error;
        setTransactions((prev) => [...processed.reverse(), ...prev]);
      } catch (e) {
        logger.error('Erro ao adicionar transações', e);
      }
    },
    [user?.id]
  );

  // --- Goals ---
  const addGoal = useCallback(
    async (goal) => {
      if (!user?.id || !supabase) return;
      try {
        const newGoal = {
          ...goal,
          user_id: user.id,
          currentAmount: 0,
          createdAt: new Date().toISOString(),
        };
        const { id, ...goalData } = newGoal;
        const { data, error } = await supabase.from('goals').insert([goalData]).select();
        if (error) throw error;
        setGoals((prev) => [data?.[0] || goalData, ...prev]);
      } catch (e) {
        logger.error('Erro ao adicionar meta', e);
      }
    },
    [user?.id]
  );

  const modifyGoal = useCallback(
    async (id, updates) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase
          .from('goals')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      } catch (e) {
        logger.error('Erro ao atualizar meta', e);
      }
    },
    [user?.id]
  );

  const deleteGoal = useCallback(
    async (id) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
        setGoals((prev) => prev.filter((g) => g.id !== id));
      } catch (e) {
        logger.error('Erro ao deletar meta', e);
      }
    },
    [user?.id]
  );

  // --- Debts ---
  const addDebt = useCallback(
    async (debt) => {
      if (!user?.id || !supabase) return;
      try {
        const newDebt = {
          ...debt,
          user_id: user.id,
          paidValue: 0,
          createdAt: new Date().toISOString(),
        };
        const { id, ...debtData } = newDebt;
        const { data, error } = await supabase.from('debts').insert([debtData]).select();
        if (error) throw error;
        setDebts((prev) => [...prev, data?.[0] || debtData]);
      } catch (e) {
        logger.error('Erro ao adicionar dívida', e);
      }
    },
    [user?.id]
  );

  const updateDebt = useCallback(
    async (id, updates) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase
          .from('debts')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      } catch (e) {
        logger.error('Erro ao atualizar dívida', e);
      }
    },
    [user?.id]
  );

  const deleteDebt = useCallback(
    async (id) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
        setDebts((prev) => prev.filter((d) => d.id !== id));
      } catch (e) {
        logger.error('Erro ao deletar dívida', e);
      }
    },
    [user?.id]
  );

  const payDebt = useCallback(
    async (id, amount) => {
      if (!user?.id || !supabase) return;
      const debt = debts.find((d) => d.id === id);
      if (!debt) return;

      const paymentAmount = parseFloat(amount);
      await updateDebt(id, {
        paidValue: Math.min((debt.paidValue || 0) + paymentAmount, debt.totalValue),
      });

      // Cria transação associada ao pagamento
      await addTransaction({
        type: 'expense',
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        description: `Pagamento de Dívida: ${debt.name}`,
        category: 'Dívidas',
        debt_id: id,
      });
    },
    [user?.id, debts, updateDebt, addTransaction]
  );

  // --- Credit Cards ---
  const addCreditCard = useCallback(
    async (card) => {
      if (!user?.id || !supabase) return;
      try {
        const newCard = {
          ...card,
          user_id: user.id,
          currentBill: 0,
          createdAt: new Date().toISOString(),
        };
        const { id, ...cardData } = newCard;
        const { data, error } = await supabase.from('credit_cards').insert([cardData]).select();
        if (error) throw error;
        setCreditCards((prev) => [...prev, data?.[0] || cardData]);
      } catch (e) {
        logger.error('Erro ao adicionar cartão', e);
      }
    },
    [user?.id]
  );

  const updateCreditCard = useCallback(
    async (id, updatesOrUpdater) => {
      if (!user?.id || !supabase) return;
      try {
        const card = creditCards.find((c) => c.id === id);
        const updates = typeof updatesOrUpdater === 'function' ? updatesOrUpdater(card) : updatesOrUpdater;
        const { error } = await supabase
          .from('credit_cards')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setCreditCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
      } catch (e) {
        logger.error('Erro ao atualizar cartão', e);
      }
    },
    [user?.id, creditCards]
  );

  const deleteCreditCard = useCallback(
    async (id) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase.from('credit_cards').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
        setCreditCards((prev) => prev.filter((c) => c.id !== id));
      } catch (e) {
        logger.error('Erro ao deletar cartão', e);
      }
    },
    [user?.id]
  );

  const addInvoiceExpense = useCallback(
    async (cardId, amount, description) => {
      const numericAmount = parseFloat(amount);
      await updateCreditCard(cardId, (card) => ({
        currentBill: (card?.currentBill || 0) + numericAmount,
      }));
      await addTransaction({
        type: 'expense',
        amount: numericAmount,
        date: new Date().toISOString().split('T')[0],
        description: description || 'Fatura de Cartão de Crédito',
        category: 'Cartão de Crédito',
      });
    },
    [updateCreditCard, addTransaction]
  );

  // --- Spending Limits ---
  const addSpendingLimit = useCallback(
    async (limit) => {
      if (!user?.id || !supabase) return;
      try {
        const { id, ...limitData } = limit;
        const newLimit = {
          ...limitData,
          user_id: user.id,
          spent: 0,
          lastResetMonth: new Date().getMonth(),
          color: ['#14B8A6', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
        };
        const { data, error } = await supabase.from('spending_limits').insert([newLimit]).select();
        if (error) throw error;
        setSpendingLimits((prev) => [data?.[0] || newLimit, ...prev]);
      } catch (e) {
        logger.error('Erro ao adicionar limite', e);
      }
    },
    [user?.id]
  );

  const updateSpendingLimit = useCallback(
    async (id, updatedFields) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase
          .from('spending_limits')
          .update(updatedFields)
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setSpendingLimits((prev) => prev.map((l) => (l.id === id ? { ...l, ...updatedFields } : l)));
      } catch (e) {
        logger.error('Erro ao atualizar limite', e);
      }
    },
    [user?.id]
  );

  const deleteSpendingLimit = useCallback(
    async (id) => {
      if (!user?.id || !supabase) return;
      try {
        const { error } = await supabase
          .from('spending_limits')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setSpendingLimits((prev) => prev.filter((l) => l.id !== id));
      } catch (e) {
        logger.error('Erro ao deletar limite', e);
      }
    },
    [user?.id]
  );

  // --- Computed financialData (mantém compatibilidade com as telas) ---
  const financialData = {
    balance: stats.balance,
    income: stats.income,
    expenses: stats.expenses,
    transactions,
    recentTransactions: transactions.slice(0, 10),
    goals,
    debts,
    limits: spendingLimits,
    creditCards,
    goalsCount: goals.length,
    limitsCount: spendingLimits.length,
    debtsCount: debts.length,
    challengesCount: 0,
    monthlyStats,
  };

  const refreshData = fetchData;

  return (
    <FinancialContext.Provider
      value={{
        financialData,
        loading,
        refreshData,
        // Transactions
        addTransaction,
        addTransactions,
        transactions,
        stats,
        monthlyStats,
        // Goals
        goals,
        addGoal,
        modifyGoal,
        deleteGoal,
        // Debts
        debts,
        addDebt,
        updateDebt,
        deleteDebt,
        payDebt,
        // Credit Cards
        creditCards,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addInvoiceExpense,
        // Spending Limits
        spendingLimits,
        addSpendingLimit,
        updateSpendingLimit,
        deleteSpendingLimit,
        // Profile
        userProfile,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}
