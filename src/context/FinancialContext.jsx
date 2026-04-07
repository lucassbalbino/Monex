
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const FinancialContext = createContext();

export function useFinancialData() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialProvider');
  }
  return context;
}

export function FinancialProvider({ children }) {
  const { userId } = useAuth();
  const userIdRef = useRef(userId);

  // Mantém o ref atualizado com o userId mais recente
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Helper para obter userId sem chamada async
  const getUserId = () => userIdRef.current;

  // Ref para controlar inicialização e prevenir loops
  const initRef = useRef(false);
  const syncRef = useRef(false);
  
  const syncTable = async (table, storageKey, setStateFn, localData) => {
   const uid = getUserId();
   if (!uid) return;
   const { data: remoteData, error: fetchError } = await supabase
     .from(table)
     .select('*')
     .eq('user_id', uid);
   if (fetchError) {
      logger.error(`Error fetching ${table} from Supabase`, fetchError);
     return;
   }
   if (remoteData && remoteData.length > 0) { setStateFn(remoteData);
   } else if (localData && localData.length > 0) {
      for (const item of localData) {
         await supabase.from(table).insert([{ ...item, user_id: uid }]);
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
      logger.error('Error loading from localStorage', e);
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
        logger.error(`Error fetching ${table} from Supabase`, e);
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
    // Remove legacy Vacation fund if it exists
    savedGoals = savedGoals.filter(g => g.id !== 'default_vacation' && g.name !== 'Fundo de Férias');
    // Normaliza nomes para evitar duplicidade
    const normalize = s => s.trim().toLowerCase();
    const hasEmergency = savedGoals.some(g => g.isFixed === true && normalize(g.name) === normalize(fixedGoals[0].name));
    const hasInvestment = savedGoals.some(g => g.isFixed === true && normalize(g.name) === normalize(fixedGoals[1].name));
    let mergedGoals = [...savedGoals];
    if (!hasEmergency) mergedGoals.unshift(fixedGoals[0]);
    if (!hasInvestment) mergedGoals.push(fixedGoals[1]);
    // Remove duplicatas de metas fixas (mantém só uma de cada)
    const uniqueGoals = [];
    const seen = new Set();
    for (const g of mergedGoals) {
      if (g.isFixed) {
        const key = normalize(g.name);
        if (seen.has(key)) continue;
        seen.add(key);
      }
      uniqueGoals.push(g);
    }
    return uniqueGoals;
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
    // Previne múltiplas execuções
    if (initRef.current) return;
    initRef.current = true;
    
    let isMounted = true;
    
    const fetchProfile = async () => {
      try {
        const uid = getUserId();
        
        if (!uid) {
           logger.warn("FinancialContext: userId não disponível.");
           return;
        }

        if (isMounted) {
           const { data: profile, error } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', uid)
             .single();
           
           if (profile && !error && isMounted) {
             setUserProfile(prev => {
               // Só atualiza se algo mudou
               if (prev?.id === profile.id && prev?.subscription_status === profile.subscription_status) {
                 return prev;
               }
               return {
                 ...prev,
                 ...profile,
                 name: profile.full_name || prev?.name,
                 isSubscribed: profile.subscription_status === 'active' || profile.subscription_status === 'trialing'
               };
             });
           }
        }
      } catch (error) {
        logger.error("Error syncing profile:", error);
      }
    };
    
    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  useEffect(() => {
    // Previne múltiplas execuções
    if (syncRef.current) return;
    syncRef.current = true;
    
    let isMounted = true;
    
    const syncAllData = async () => {
      try {
        const uid = getUserId();
        if (!uid || !isMounted) return;

        await syncTable('transactions', 'monex_transactions', setTransactions, loadFromStorage('monex_transactions', []));
        if (!isMounted) return;
        await syncTable('goals', 'monex_goals', setGoals, loadFromStorage('monex_goals', []));
        if (!isMounted) return;
        await syncTable('debts', 'monex_debts', setDebts, loadFromStorage('monex_debts', []));
        if (!isMounted) return;
        await syncTable('credit_cards', 'monex_credit_cards', setCreditCards, loadFromStorage('monex_credit_cards', []));
        if (!isMounted) return;
        await syncTable('spending_limits', 'monex_limits', setSpendingLimits, loadFromStorage('monex_limits', []));
      } catch (err) {
        logger.error("Error syncing data:", err);
      }
    };

    syncAllData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Removido userProfile para evitar loop
  
  const defaultLimits = [
    { name: 'Compras de Mercado', category: 'Mercado', limit: 800, spent: 0, period: 'Mensal', color: '#14B8A6', lastResetMonth: new Date().getMonth() },
    { name: 'Lazer Fim de Semana', category: 'Lazer e Hobbies', limit: 300, spent: 0, period: 'Semanal', color: '#F59E0B', lastResetMonth: new Date().getMonth() }
  ];
  const [spendingLimits, setSpendingLimits] = useState(() => {
    const saved = loadFromStorage('monex_limits', []);
    if (!saved || saved.length === 0) {
      return defaultLimits;
    }
    // Remove duplicatas de limites fixos pelo nome
    const normalize = s => s.trim().toLowerCase();
    const uniqueLimits = [];
    const seen = new Set();
    for (const limit of saved) {
      const key = normalize(limit.name);
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueLimits.push(limit);
    }
    return uniqueLimits;
  });

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
  // Executa apenas UMA vez na montagem para calcular spent inicial
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    setSpendingLimits(prevLimits => {
      // Verifica se precisa atualizar - evita loops
      let needsUpdate = false;
      
      const newLimits = prevLimits.map(limit => {
        let newLimit = { ...limit };
        
        if (limit.period === 'Mensal' && limit.lastResetMonth !== currentMonth) {
          newLimit = { ...newLimit, spent: 0, lastResetMonth: currentMonth };
          needsUpdate = true;
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
          
          // Só atualiza se o valor mudou
          if (Math.abs(calculatedSpent - (limit.spent || 0)) > 0.01) {
            newLimit = { ...newLimit, spent: calculatedSpent, lastResetMonth: currentMonth };
            needsUpdate = true;
          }
        }
        
        return newLimit;
      });
      
      // Só retorna novo array se algo mudou
      return needsUpdate ? newLimits : prevLimits;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Actions ---

  const addTransaction = async (transaction) => {
   const uid = getUserId();
   if (!uid) {
     logger.error("Usuário não autenticado. Transação não salva.");
     return;
   }
     const newTransaction = {
        ...transaction,
        user_id: uid,
        amount: parseFloat(transaction.amount)
      };
      // Remove o campo 'id' se existir
      const { id, ...transactionData } = newTransaction;
      setTransactions(prev => [transactionData, ...prev]);
      localStorage.setItem('monex_transactions', JSON.stringify([transactionData, ...transactions]));
      await supabase.from('transactions').insert([transactionData]);
      if (transactionData.type === 'expense') {
        updateLimitsWithExpense(transactionData.category, transactionData.amount, transactionData.date);
      }
  };

  const addTransactions = async (newTransactions) => {
    const processedTransactions = newTransactions.map((t, index) => ({
      ...t,
      
      amount: parseFloat(t.amount)
    })).reverse();
    setTransactions(prev => [...processedTransactions, ...prev]);
      localStorage.setItem('monex_transactions', JSON.stringify([...processedTransactions, ...transactions]));
      const uid = getUserId();
      if (uid) {
        const toInsert = processedTransactions.map(t => ({ ...t, user_id: uid }));
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
      currentAmount: 0,
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [newGoal, ...prev]);
    localStorage.setItem('monex_goals', JSON.stringify([newGoal, ...goals]));
    const uid = getUserId();
    if (uid) {
        await supabase.from('goals').insert([{ ...newGoal, user_id: uid }]);
      }
  };

  const modifyGoal = async (id, updates) => {
   // 1. Cria novo array local atualizado
   const updatedGoals = goals.map(g => g.id === id ? { ...g, ...updates } : g);
 
   // 2. Atualiza state e localStorage
   setGoals(updatedGoals);
   localStorage.setItem('monex_goals', JSON.stringify(updatedGoals));
 
   // 3. Atualiza o item correspondente no Supabase
   const uid = getUserId();
   if (uid) {
     await supabase.from('goals')
       .update(updates)
       .eq('id', id)
       .eq('user_id', uid);
   }
 };
   const deleteGoal = async (id) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      localStorage.setItem('monex_goals', JSON.stringify(goals.filter(g => g.id !== id)));
      const uid = getUserId();
      if (uid) {
        await supabase.from('goals')
          .delete()
          .eq('id', id)
          .eq('user_id', uid);
      }
  };

  
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
      paidValue: 0,
      createdAt: new Date().toISOString()
    };
    setDebts(prev => [...prev, newDebt]);
    localStorage.setItem('monex_debts', JSON.stringify([...debts, newDebt]));
    const uid = getUserId();
    if (uid) {
        await supabase.from('debts').insert([{ ...newDebt, user_id: uid }]);
      }
  };

  const updateDebt = async (id, updates) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const updatedDebts = debts.map(d => d.id === id ? { ...d, ...updates } : d);
    localStorage.setItem('monex_debts', JSON.stringify(updatedDebts));
    const uid = getUserId();
    if (uid) {
        await supabase.from('debts')
          .update(updates)
          .eq('id', id)
          .eq('user_id', uid);
      }

  };

  const deleteDebt = async (id) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    localStorage.setItem('monex_debts', JSON.stringify(debts.filter(d => d.id !== id)));
    const uid = getUserId();
    if (uid) {
        await supabase.from('debts')
          .delete()
          .eq('id', id)
          .eq('user_id', uid);
      }
  };

  const payDebt = async (id, amount) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const paymentAmount = parseFloat(amount);
    // Update debt
    await updateDebt(id, { paidValue: Math.min(debt.paidValue + paymentAmount, debt.totalValue) });

    // Cria a transação de pagamento de dívida
    const transaction = {
      type: 'expense',
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      description: `Pagamento de Dívida: ${debt.name}`,
      category: 'Dívidas',
      debt_id: id // Relaciona a transação à dívida
    };

    // Adiciona localmente e persiste
    setTransactions(prev => [transaction, ...prev]);
    localStorage.setItem('monex_transactions', JSON.stringify([transaction, ...transactions]));

    // Persiste no Supabase
    const uid = getUserId();
    if (uid) {
      await supabase.from('transactions').insert([{ ...transaction, user_id: uid }]);
    }
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
   const uid = getUserId();
   if (!uid) {
        logger.error("Usuário não está autenticado! Cartão só salvo local.");
     return;
   }
   const { error: insertError } = await supabase.from('credit_cards').insert([{ ...newCard, user_id: uid }]);
   if (insertError) {
     // Exibe no console e na UI
        logger.error("Erro ao inserir cartão no Supabase:", insertError);
     // Se você usa Toast no projeto:
     toast({
       title: "Erro ao salvar cartão no banco",
       description: insertError.message || "Verifique sua conexão e as permissões.",
       variant: "destructive"
     });
   } else {
     // Sucesso opcional
     logger.info("Cartão salvo no Supabase com sucesso");
     // toast({ title: "Cartão salvo no banco!", description: "OK" });
   }
 };

  const updateCreditCard = async (id, updatesOrUpdater) => {
    setCreditCards(prev => {
      const updatedCards = prev.map(c => {
        if (c.id === id) {
          const updates = typeof updatesOrUpdater === 'function' ? updatesOrUpdater(c) : updatesOrUpdater;
          return { ...c, ...updates };
        }
        return c;
      });
      localStorage.setItem('monex_credit_cards', JSON.stringify(updatedCards));
      return updatedCards;
    });
    // Para garantir que o valor enviado ao Supabase é o correto, busque o cartão atualizado do estado
    const card = creditCards.find(c => c.id === id);
    const updates = typeof updatesOrUpdater === 'function' ? updatesOrUpdater(card) : updatesOrUpdater;
    const uid = getUserId();
    if (uid) {
      await supabase.from('credit_cards')
        .update(updates)
        .eq('id', id)
        .eq('user_id', uid);
    }
  };

  const deleteCreditCard = async (id) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
      localStorage.setItem('monex_credit_cards', JSON.stringify(creditCards.filter(c => c.id !== id)));
      const uid = getUserId();
      if (uid) {
        await supabase.from('credit_cards')
          .delete()
          .eq('id', id)
          .eq('user_id', uid);
      }
  };

  const addInvoiceExpense = async (cardId, amount, description) => {
    // 1. Update card bill de forma segura
    const numericAmount = parseFloat(amount);
    await updateCreditCard(cardId, (card) => ({ currentBill: (card?.currentBill || 0) + numericAmount }));
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
  const addChallenge = (challenge) => { logger.warn("Disabled"); };

  const updateChallengeProgress = (id, type, amount) => { logger.warn("Disabled"); };

  const modifyChallenge = (id, updates) => { logger.warn("Disabled"); };

  const deleteChallenge = (id) => { logger.warn("Disabled"); };

  const addSpendingLimit = async (limit) => {
    const { id, ...limitData } = limit;
    const newLimit = {
      ...limitData,
      spent: 0,
      lastResetMonth: new Date().getMonth(),
      color: ['#14B8A6', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)]
    };
    setSpendingLimits(prev => [newLimit, ...prev]);
    localStorage.setItem('monex_limits', JSON.stringify([newLimit, ...spendingLimits]));
    const uid = getUserId();
    if (uid) {
      await supabase.from('spending_limits').insert([{ ...newLimit, user_id: uid }]);
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
     const uid = getUserId();
     if (uid) {
       await supabase
         .from('spending_limits')
         .update(updatedFields)
         .eq('id', id)
         .eq('user_id', uid);
     }
   } catch (e) {
     logger.error("Erro ao atualizar limite no Supabase:", e);
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
