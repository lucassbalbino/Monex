
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const FinancialContext = createContext();

export const useFinancialData = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider = ({ children }) => {
  const syncTable = async (table, storageKey, setStateFn, localData) => {
   const {data, error} = await supabase.auth.getUser();
   if (error || !data.user) return;
   const { data: remoteData, error: fetchError } = await supabase
     .from(table)
     .select('*')
     .eq('user_id', data.user.id);
   if (fetchError) {
     console.error(`Error fetching ${table} from Supabase`, fetchError);
     return;
   }
   if (remoteData && remoteData.length > 0) { setStateFn(remoteData);
   } else if (localData && localData.length > 0) {
      for (const item of localData) {
         await supabase.from(table).insert([{ ...item, user_id: data.user.id }]);
    }
   }
   };
  const { toast } = useToast();

  // Persistence helper
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error('Error loading from localStorage', e);
      return defaultValue;
    }
  };
  const fetchFromSupabase = async (table, userId) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`Error fetching ${table} from Supabase`, e);
      return null;
    }
  }
  // Helper to parse date string (YYYY-MM-DD) safely as local date
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // --- Initial Data Loading ---
  const fixedGoals = [
    {
      id: 'fixed_emergency',
      name: 'Reserva de Emergência',
      description: 'Fundo essencial para cobrir 3-6 meses de despesas em caso de imprevistos.',
      targetAmount: 15000,
      currentAmount: 0,
      months: 12,
      isDefault: true,
      isFixed: true,
      category: 'Segurança'
    },
    {
      id: 'fixed_investment',
      name: 'Investimentos',
      description: 'Capital acumulado para liberdade financeira e crescimento de patrimônio.',
      targetAmount: 50000,
      currentAmount: 0,
      months: 60,
      isDefault: true,
      isFixed: true,
      category: 'Investimento'
    }
  ];

  const [transactions, setTransactions] = useState(() => loadFromStorage('monex_transactions', []));
  
  // Goals State with enforcement of fixed goals
  const [goals, setGoals] = useState(() => {
    let savedGoals = loadFromStorage('monex_goals', []);
    
    // If no goals, start with fixed ones
    if (!savedGoals || savedGoals.length === 0) {
      return fixedGoals;
    }

    // Migration: Ensure fixed goals exist and remove Vacation if present per request
    const hasEmergency = savedGoals.some(g => g.id === 'fixed_emergency' || g.name === 'Reserva de Emergência');
    const hasInvestment = savedGoals.some(g => g.id === 'fixed_investment' || g.name === 'Investimentos');
    
    let mergedGoals = [...savedGoals];

    // Remove legacy Vacation fund if it exists
    mergedGoals = mergedGoals.filter(g => g.id !== 'default_vacation' && g.name !== 'Fundo de Férias');

    if (!hasEmergency) mergedGoals.unshift(fixedGoals[0]);
    if (!hasInvestment) mergedGoals.push(fixedGoals[1]);

    // Ensure they are marked fixed
    return mergedGoals.map(g => {
      if (g.id === 'fixed_emergency' || g.name === 'Reserva de Emergência') return { ...g, isFixed: true };
      if (g.id === 'fixed_investment' || g.name === 'Investimentos') return { ...g, isFixed: true };
      return g;
    });
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    const profile = loadFromStorage('monex_user_profile', null);
    if (profile) {
      return {
        ...profile,
        debtTypes: Array.isArray(profile.debtTypes) ? profile.debtTypes : [],
        insurance: Array.isArray(profile.insurance) ? profile.insurance : [],
        savingsTargetPercent: profile.savingsTargetPercent || 20,
      };
    }
    return null;
  });

  // --- Sync Profile with Supabase ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
           // Handle invalid token errors gracefully
           if (userError.status === 403 || userError.message?.toLowerCase().includes('jwt') || userError.message?.toLowerCase().includes('claim')) {
             console.warn("Invalid session in FinancialContext. Signing out.");
             await supabase.auth.signOut();
             window.location.href = '/'; // Force redirect to home/login
             return;
           }
           throw userError;
        }

        if (user) {
           const { data: profile, error } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', user.id)
             .single();
           
           if (profile && !error) {
             setUserProfile(prev => ({
               ...prev,
               ...profile, // Merge DB profile into local state
               name: profile.full_name || prev?.name,
               isSubscribed: profile.subscription_status === 'active' || profile.subscription_status === 'trialing'
             }
            
            ));
           }
        }
      } catch (error) {
        console.error("Error syncing profile:", error);
      }
    };
    
    fetchProfile();
  }, []);
  useEffect(() => {
    const syncAllData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await syncTable('transactions', 'monex_transactions', setTransactions, loadFromStorage('monex_transactions', []));
      await syncTable('goals', 'monex_goals', setGoals, loadFromStorage('monex_goals', []));
      await syncTable('debts', 'monex_debts', setDebts, loadFromStorage('monex_debts', []));
      await syncTable('credit_cards', 'monex_credit_cards', setCreditCards, loadFromStorage('monex_credit_cards', []));
      await syncTable('spending_limits', 'monex_limits', setSpendingLimits, loadFromStorage('monex_limits', []));
    };

    syncAllData();
  }, [userProfile]);
  
  const defaultLimits = [
    { id: 1, name: 'Compras de Mercado', category: 'Mercado', limit: 800, spent: 0, period: 'Mensal', color: '#14B8A6', lastResetMonth: new Date().getMonth() },
    { id: 2, name: 'Lazer Fim de Semana', category: 'Lazer e Hobbies', limit: 300, spent: 0, period: 'Semanal', color: '#F59E0B', lastResetMonth: new Date().getMonth() }
  ];
  const [spendingLimits, setSpendingLimits] = useState(() => loadFromStorage('monex_limits', defaultLimits));

  const [challenges, setChallenges] = useState([]); 

  // Debts State
  const [debts, setDebts] = useState(() => loadFromStorage('monex_debts', []));

  // Credit Cards State
  const [creditCards, setCreditCards] = useState(() => loadFromStorage('monex_credit_cards', []));

  // Global lifetime stats
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    savingsGoal: 0
  });

  const [monthlyStats, setMonthlyStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0
  });

  const [annualStats, setAnnualStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0
  });

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('monex_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('monex_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('monex_limits', JSON.stringify(spendingLimits)); }, [spendingLimits]);
  useEffect(() => { localStorage.setItem('monex_debts', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('monex_credit_cards', JSON.stringify(creditCards)); }, [creditCards]);
  
  useEffect(() => { 
    if (userProfile === null) {
      localStorage.removeItem('monex_user_profile');
    } else {
      localStorage.setItem('monex_user_profile', JSON.stringify(userProfile)); 
    }
  }, [userProfile]);

  // --- Stats Calculation ---
  useEffect(() => {
    const lifetime = { balance: 0, income: 0, expenses: 0, savingsGoal: 0 };
    const monthly = { balance: 0, income: 0, expenses: 0 };
    const annual = { balance: 0, income: 0, expenses: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      const tDate = parseDate(t.date);
      
      if (t.type === 'income') {
        lifetime.balance += amount;
        lifetime.income += amount;
      } else {
        lifetime.balance -= amount;
        lifetime.expenses += amount;
      }

      if (tDate.getFullYear() === currentYear) {
        if (t.type === 'income') {
          annual.income += amount;
        } else {
          annual.expenses += amount;
        }
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
    annual.balance = annual.income - annual.expenses;

    setStats(lifetime);
    setMonthlyStats(monthly);
    setAnnualStats(annual);
  }, [transactions]);

 
  // --- Data Integrity & Sync ---
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    setSpendingLimits(prevLimits => {
      return prevLimits.map(limit => {
        if (limit.period === 'Mensal' && limit.lastResetMonth !== currentMonth) {
          return { ...limit, spent: 0, lastResetMonth: currentMonth };
        }
        if (limit.category) {
          const calculatedSpent = transactions.reduce((total, t) => {
            if (t.type !== 'expense' || t.category !== limit.category) return total;
            const tDate = parseDate(t.date);
            let inPeriod = false;
            if (limit.period === 'Mensal') {
              inPeriod = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            } else if (limit.period === 'Anual') {
              inPeriod = tDate.getFullYear() === currentYear;
            } else if (limit.period === 'Semanal') {
              const diffTime = Math.abs(now - tDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              inPeriod = diffDays <= 7;
            }
            return inPeriod ? total + parseFloat(t.amount) : total;
          }, 0);
          return { ...limit, spent: calculatedSpent, lastResetMonth: currentMonth };
        }
        return limit;
      });
    });
  }, []);

  // --- Actions ---

  const addTransaction = async (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      amount: parseFloat(transaction.amount)
    };
    setTransactions(prev => [newTransaction, ...prev]);
    localStorage.setItem('monex_transactions', JSON.stringify([newTransaction, ...transactions]));
    
    const {data, error} = await supabase.auth.getUser();
    if (data && data.user) {
        await supabase.from('transactions').insert([{ ...newTransaction, user_id: data.user.id }]);
      }

    if (newTransaction.type === 'expense') {
      updateLimitsWithExpense(newTransaction.category, newTransaction.amount, newTransaction.date);
    }
  };

  const addTransactions = async (newTransactions) => {
    const processedTransactions = newTransactions.map((t, index) => ({
      ...t,
      id: Date.now() + index,
      amount: parseFloat(t.amount)
    })).reverse();
    setTransactions(prev => [...processedTransactions, ...prev]);
      localStorage.setItem('monex_transactions', JSON.stringify([...processedTransactions, ...transactions]));
      const {data, error} = await supabase.auth.getUser();
      if (data && data.user) {
        const toInsert = processedTransactions.map(t => ({ ...t, user_id: data.user.id }));
        await supabase.from('transactions').insert(toInsert);
      }
    processedTransactions.forEach(t => {
      if (t.type === 'expense') {
        updateLimitsWithExpense(t.category, t.amount, t.date);
      }
    });
  };

  const updateLimitsWithExpense = (category, amount, date) => {
    const tDate = parseDate(date);
    const now = new Date();
    setSpendingLimits(prev => prev.map(limit => {
      if (limit.category === category) {
        let shouldUpdate = false;
        if (limit.period === 'Mensal' && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
          shouldUpdate = true;
        } else if (limit.period === 'Anual' && tDate.getFullYear() === now.getFullYear()) {
          shouldUpdate = true;
        } else if (limit.period === 'Semanal') {
          const diffTime = Math.abs(now - tDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) shouldUpdate = true;
        }
        if (shouldUpdate) {
          return { ...limit, spent: limit.spent + parseFloat(amount) };
        }
      }
      return limit;
    }));
  };

  const addGoal = async (goal) => {
    const newGoal = {
      ...goal,
      id: Date.now(),
      currentAmount: 0,
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [newGoal, ...prev]);
    localStorage.setItem('monex_goals', JSON.stringify([newGoal, ...goals]));
    const {data, error} = await supabase.auth.getUser();
    if (data && data.user) {
        await supabase.from('goals').insert([{ ...newGoal, user_id: data.user.id }]);
      }
  };

  const modifyGoal = async (id, updates) => {
   // 1. Cria novo array local atualizado
   const updatedGoals = goals.map(g => g.id === id ? { ...g, ...updates } : g);
 
   // 2. Atualiza state e localStorage
   setGoals(updatedGoals);
   localStorage.setItem('monex_goals', JSON.stringify(updatedGoals));
 
   // 3. Atualiza o item correspondente no Supabase
   const { data, error } = await supabase.auth.getUser();
   if (data && data.user) {
     await supabase.from('goals')
       .update(updates)
       .eq('id', id)
       .eq('user_id', data.user.id);
   }
 };

 const updatedGoals = goals.filter(g => g.id !== id);

  
  const resetToDefaultGoals = () => {
    setGoals(fixedGoals);
    toast({
      title: "Metas restauradas",
      description: "Suas metas foram redefinidas para o padrão do sistema."
    });
  };

  // --- Debt Actions ---
  const addDebt = async (debt) => {
    const newDebt = {
      ...debt,
      id: Date.now(),
      paidValue: 0,
      createdAt: new Date().toISOString()
    };
    setDebts(prev => [...prev, newDebt]);
    localStorage.setItem('monex_debts', JSON.stringify([...debts, newDebt]));
    const {data, error} = await supabase.auth.getUser();
    if (data && data.user) {
        await supabase.from('debts').insert([{ ...newDebt, user_id: data.user.id }]);
      }
  };

  const updateDebt = async (id, updates) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const updatedDebts = debts.map(d => d.id === id ? { ...d, ...updates } : d);
    localStorage.setItem('monex_debts', JSON.stringify(updatedDebts));
    const {data, error} = await supabase.auth.getUser();
    if (data && data.user) {
        await supabase.from('debts')
          .update(updates)
          .eq('id', id)
          .eq('user_id', data.user.id);
      }

  };

  const deleteDebt = async (id) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    localStorage.setItem('monex_debts', JSON.stringify(debts.filter(d => d.id !== id)));
    const {data, error} = await supabase.auth.getUser();
    if (data && data.user) {
        await supabase.from('debts')
          .delete()
          .eq('id', id)
          .eq('user_id', data.user.id);
      }
  };

  const payDebt = async (id, amount) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const paymentAmount = parseFloat(amount);
    
    // Update debt
    await updateDebt(id, { paidValue: Math.min(debt.paidValue + paymentAmount, debt.totalValue) });

    // Record transaction
    await addTransaction({
      type: 'expense',
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      description: `Pagamento de Dívida: ${debt.name}`,
      category: 'Dívidas'
    });
  };

  // --- Credit Card Actions ---
  const addCreditCard = async (card) => {
    const newCard = {
      ...card,
      id: Date.now(),
      currentBill: 0,
      createdAt: new Date().toISOString()
    };
    setCreditCards(prev => [...prev, newCard]);
    localStorage.setItem('monex_credit_cards', JSON.stringify([...creditCards, newCard]));
    const {data, error} = await supabase.auth.getUser();
      if (data && data.user) {
         await supabase.from('credit_cards').insert([{ ...newCard, user_id: data.user.id }]);
         }

  };

  const updateCreditCard = async (id, updates) => {
    setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const updatedCards = creditCards.map(c => c.id === id ? { ...c, ...updates } : c);
    localStorage.setItem('monex_credit_cards', JSON.stringify(updatedCards));
    const {data, error} = await supabase.auth.getUser();
    if (data && data.user) {
        supabase.from('credit_cards')
          .update(updates)
          .eq('id', id)
          .eq('user_id', data.user.id);
      }
  };

  const deleteCreditCard = async (id) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
      localStorage.setItem('monex_credit_cards', JSON.stringify(creditCards.filter(c => c.id !== id)));
      const {data, error} = await supabase.auth.getUser();
      if (data && data.user) {
        await supabase.from('credit_cards')
          .delete()
          .eq('id', id)
          .eq('user_id', data.user.id);
      }
  };

  const addInvoiceExpense = async (cardId, amount, description) => {
    // 1. Update card bill
    const numericAmount = parseFloat(amount);
    await updateCreditCard(cardId, { currentBill: (creditCards.find(c => c.id === cardId)?.currentBill || 0) + numericAmount });
    
    // 2. Add to transaction history as an expense
    await addTransaction({
      type: 'expense',
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
      description: description || 'Fatura de Cartão de Crédito',
      category: 'Cartão de Crédito'
    });
  };

  // --- Challenge Actions (Stubbed) ---
  const addChallenge = (challenge) => { console.warn("Disabled"); };

  const updateChallengeProgress = (id, type, amount) => { console.warn("Disabled"); };

  const modifyChallenge = (id, updates) => { console.warn("Disabled"); };

  const deleteChallenge = (id) => { console.warn("Disabled"); };

  const addSpendingLimit = async (limit) => {
    const newLimit = {
      ...limit,
      id: Date.now(),
      spent: 0,
      lastResetMonth: new Date().getMonth(),
      color: ['#14B8A6', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)]
    };
    setSpendingLimits(prev => [newLimit, ...prev]);
    localStorage.setItem('monex_limits', JSON.stringify([newLimit, ...spendingLimits]));
    const {data, error} = await supabase.auth.getUser();
      if (data && data.user) {
         await supabase.from('spending_limits').insert([{ ...newLimit, user_id: data.user.id }]);
         }
  };

  const updateSpendingLimit = async (id, updatedFields) => {
   // 1. Atualize o estado e o localStorage juntos
   setSpendingLimits(prev => {
     const updatedLimits = prev.map(limit =>
       limit.id === id ? { ...limit, ...updatedFields } : limit
     );
     localStorage.setItem('monex_limits', JSON.stringify(updatedLimits));
     return updatedLimits;
   });
 
   // 2. Atualize no Supabase (se o usuário estiver logado)
   try {
     const { data, error } = await supabase.auth.getUser();
     if (error) throw error;
     if (data && data.user) {
       await supabase
         .from('spending_limits')
         .update(updatedFields)
         .eq('id', id)
         .eq('user_id', data.user.id);
     }
   } catch (e) {
     console.error("Erro ao atualizar limite no Supabase:", e);
   }
 };

 const deleteSpendingLimit = (id) => {
   setSpendingLimits(prev => {
     const updated = prev.filter(limit => limit.id !== id);
     localStorage.setItem('monex_limits', JSON.stringify(updated));
     return updated;
   });
 };

  const updateUserProfile = (profile) => {
    setUserProfile(profile);
    
  };

  const clearUserProfile = () => {
    setUserProfile(null);
    localStorage.removeItem('monex_user_profile');
  };

  return (
    <FinancialContext.Provider value={{ 
      transactions, 
      stats, 
      monthlyStats,
      annualStats,
      goals, 
      challenges,
      spendingLimits,
      userProfile,
      debts, 
      creditCards, // Export credit cards
      addTransaction, 
      addTransactions, 
      addGoal, 
      modifyGoal,
      deleteGoal,
      resetToDefaultGoals,
      addChallenge,
      updateChallengeProgress,
      modifyChallenge,
      deleteChallenge,
      addSpendingLimit,
      updateSpendingLimit,
      deleteSpendingLimit,
      updateUserProfile,
      clearUserProfile,
      addDebt, 
      updateDebt,
      deleteDebt,
      payDebt,
      addCreditCard, // Export credit card actions
      updateCreditCard,
      deleteCreditCard,
      addInvoiceExpense
    }}>
      {children}
    </FinancialContext.Provider>
  );
};
