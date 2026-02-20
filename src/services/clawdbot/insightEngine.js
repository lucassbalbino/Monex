/**
 * Monex Insight Engine
 * 
 * Motor de análise proativa que examina os dados financeiros do usuário
 * e gera insights inteligentes automaticamente.
 */

import { formatCurrency } from '@/lib/utils';

// Tipos de insight com prioridade
export const INSIGHT_TYPES = {
  ALERT: 'alert',           // Urgente - limite estourado, vencimento hoje
  WARNING: 'warning',       // Atenção - perto do limite, tendência ruim
  TIP: 'tip',               // Dica - oportunidade de economia
  ACHIEVEMENT: 'achievement', // Conquista - meta atingida, melhora
  ANALYSIS: 'analysis',     // Análise - padrão detectado
};

export const INSIGHT_PRIORITIES = {
  [INSIGHT_TYPES.ALERT]: 5,
  [INSIGHT_TYPES.WARNING]: 4,
  [INSIGHT_TYPES.TIP]: 3,
  [INSIGHT_TYPES.ACHIEVEMENT]: 2,
  [INSIGHT_TYPES.ANALYSIS]: 1,
};

/**
 * Analisa limites de gastos e gera alertas quando próximos ou acima do limite
 */
function analyzeSpendingLimits(spendingLimits) {
  const insights = [];

  spendingLimits.forEach(limit => {
    if (!limit.limit || limit.limit <= 0) return;
    const percentage = (limit.spent / limit.limit) * 100;

    if (percentage >= 100) {
      insights.push({
        id: `limit-exceeded-${limit.category}`,
        type: INSIGHT_TYPES.ALERT,
        icon: 'AlertTriangle',
        title: `Limite de "${limit.category}" ultrapassado!`,
        description: `Você gastou ${formatCurrency(limit.spent)} de ${formatCurrency(limit.limit)} (${Math.round(percentage)}%). Considere pausar gastos nessa categoria.`,
        category: limit.category,
        actionLabel: 'Ajustar limite',
        actionType: 'adjustLimit',
        actionData: { limitId: limit.id, category: limit.category },
        timestamp: Date.now(),
      });
    } else if (percentage >= 80) {
      insights.push({
        id: `limit-warning-${limit.category}`,
        type: INSIGHT_TYPES.WARNING,
        icon: 'TrendingUp',
        title: `Perto do limite em "${limit.category}"`,
        description: `Já usou ${Math.round(percentage)}% do limite. Restam ${formatCurrency(limit.limit - limit.spent)} para o período.`,
        category: limit.category,
        actionLabel: 'Ver detalhes',
        actionType: 'viewCategory',
        actionData: { category: limit.category },
        timestamp: Date.now(),
      });
    }
  });

  return insights;
}

/**
 * Analisa metas e gera insights de progresso
 */
function analyzeGoals(goals) {
  const insights = [];
  const now = new Date();

  goals.forEach(goal => {
    if (!goal.targetAmount || goal.targetAmount <= 0) return;
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - (goal.currentAmount || 0);

    if (progress >= 100) {
      insights.push({
        id: `goal-achieved-${goal.name}`,
        type: INSIGHT_TYPES.ACHIEVEMENT,
        icon: 'Trophy',
        title: `Meta "${goal.name}" atingida! 🎉`,
        description: `Parabéns! Você alcançou ${formatCurrency(goal.currentAmount)} da meta de ${formatCurrency(goal.targetAmount)}.`,
        actionLabel: 'Criar nova meta',
        actionType: 'createGoal',
        actionData: {},
        timestamp: Date.now(),
      });
    } else if (progress >= 75) {
      insights.push({
        id: `goal-almost-${goal.name}`,
        type: INSIGHT_TYPES.ACHIEVEMENT,
        icon: 'Target',
        title: `Quase lá! "${goal.name}" em ${Math.round(progress)}%`,
        description: `Faltam apenas ${formatCurrency(remaining)} para completar essa meta.`,
        actionLabel: 'Adicionar valor',
        actionType: 'addToGoal',
        actionData: { goalId: goal.id, goalName: goal.name },
        timestamp: Date.now(),
      });
    } else if (progress >= 50) {
      insights.push({
        id: `goal-halfway-${goal.name}`,
        type: INSIGHT_TYPES.ACHIEVEMENT,
        icon: 'Target',
        title: `Metade do caminho! "${goal.name}" em ${Math.round(progress)}%`,
        description: `Já acumulou ${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)}. Continue assim!`,
        actionLabel: 'Adicionar valor',
        actionType: 'addToGoal',
        actionData: { goalId: goal.id, goalName: goal.name },
        timestamp: Date.now(),
      });
    } else if (progress < 10 && goal.months && goal.months <= 6) {
      insights.push({
        id: `goal-behind-${goal.name}`,
        type: INSIGHT_TYPES.WARNING,
        icon: 'Clock',
        title: `Meta "${goal.name}" precisa de atenção`,
        description: `Progresso de apenas ${Math.round(progress)}% com prazo de ${goal.months} meses. Considere aumentar os aportes mensais.`,
        actionLabel: 'Revisar meta',
        actionType: 'viewGoal',
        actionData: { goalId: goal.id },
        timestamp: Date.now(),
      });
    }

    // Ritmo mensal necessário para atingir a meta
    if (progress < 100 && goal.months && goal.months > 0 && remaining > 0) {
      const monthlyNeeded = remaining / goal.months;
      if (monthlyNeeded > 0) {
        insights.push({
          id: `goal-pace-${goal.name}`,
          type: INSIGHT_TYPES.ANALYSIS,
          icon: 'TrendingUp',
          title: `Ritmo para "${goal.name}"`,
          description: `Para atingir essa meta em ${goal.months} meses, você precisa depositar ${formatCurrency(monthlyNeeded)}/mês. Progresso atual: ${Math.round(progress)}%.`,
          actionLabel: 'Adicionar valor',
          actionType: 'addToGoal',
          actionData: { goalId: goal.id, goalName: goal.name },
          timestamp: Date.now(),
        });
      }
    }
  });

  // Meta mais próxima de ser concluída (entre 50-99%)
  const closestGoal = goals
    .filter(g => g.targetAmount > 0)
    .map(g => ({ ...g, progress: ((g.currentAmount || 0) / g.targetAmount) * 100 }))
    .filter(g => g.progress >= 50 && g.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  if (closestGoal) {
    const diff = closestGoal.targetAmount - (closestGoal.currentAmount || 0);
    insights.push({
      id: `goal-closest-${closestGoal.name}`,
      type: INSIGHT_TYPES.TIP,
      icon: 'Lightbulb',
      title: `Foco: "${closestGoal.name}" está quase!`,
      description: `Faltam só ${formatCurrency(diff)} (${Math.round(100 - closestGoal.progress)}%). Um aporte extra pode fechar essa meta!`,
      actionLabel: 'Depositar agora',
      actionType: 'addToGoal',
      actionData: { goalId: closestGoal.id, goalName: closestGoal.name },
      timestamp: Date.now(),
    });
  }

  return insights;
}

/**
 * Analisa transações recentes para detectar padrões
 */
function analyzeTransactions(transactions, monthlyStats) {
  const insights = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtrar transações do mês atual
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const expenses = monthlyTransactions.filter(t => t.type === 'expense');

  // Agrupar por categoria
  const categoryTotals = {};
  expenses.forEach(t => {
    const cat = t.category || 'Outros';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount);
  });

  // Encontrar a maior categoria de gasto
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0) {
    const [topCategory, topAmount] = sortedCategories[0];
    const totalExpenses = monthlyStats.expenses || 1;
    const percentage = Math.round((topAmount / totalExpenses) * 100);

    if (percentage > 40) {
      insights.push({
        id: `top-category-${topCategory}`,
        type: INSIGHT_TYPES.ANALYSIS,
        icon: 'PieChart',
        title: `"${topCategory}" domina seus gastos`,
        description: `${Math.round(percentage)}% das suas despesas mensais (${formatCurrency(topAmount)}) são em "${topCategory}". Diversificar pode ajudar no controle.`,
        actionLabel: 'Criar limite',
        actionType: 'createLimit',
        actionData: { category: topCategory },
        timestamp: Date.now(),
      });
    }
  }

  // Detectar gastos recorrentes pequenos (assinaturas)
  const descriptionCounts = {};
  expenses.forEach(t => {
    const key = (t.description || '').toLowerCase().trim();
    if (key) {
      if (!descriptionCounts[key]) {
        descriptionCounts[key] = { count: 0, total: 0, description: t.description };
      }
      descriptionCounts[key].count++;
      descriptionCounts[key].total += parseFloat(t.amount);
    }
  });

  Object.values(descriptionCounts).forEach(item => {
    if (item.count >= 2 && item.total > 50) {
      insights.push({
        id: `recurring-${item.description}`,
        type: INSIGHT_TYPES.TIP,
        icon: 'Repeat',
        title: `Gasto recorrente detectado`,
        description: `"${item.description}" aparece ${item.count}x este mês, totalizando ${formatCurrency(item.total)}. Você ainda precisa disso?`,
        actionLabel: 'Analisar',
        actionType: 'viewTransactions',
        actionData: { description: item.description },
        timestamp: Date.now(),
      });
    }
  });

  // Balanço mensal negativo
  if (monthlyStats.balance < 0) {
    insights.push({
      id: 'negative-balance',
      type: INSIGHT_TYPES.ALERT,
      icon: 'AlertOctagon',
      title: 'Saldo mensal negativo!',
      description: `Suas despesas (${formatCurrency(monthlyStats.expenses)}) superaram sua renda (${formatCurrency(monthlyStats.income)}) em ${formatCurrency(Math.abs(monthlyStats.balance))} este mês.`,
      actionLabel: 'Ver resumo',
      actionType: 'viewSummary',
      actionData: {},
      timestamp: Date.now(),
    });
  }

  // Taxa de economia
  if (monthlyStats.income > 0) {
    const savingsRate = ((monthlyStats.income - monthlyStats.expenses) / monthlyStats.income) * 100;
    
    if (savingsRate >= 20) {
      insights.push({
        id: 'good-savings-rate',
        type: INSIGHT_TYPES.ACHIEVEMENT,
        icon: 'Sparkles',
        title: `Ótima taxa de economia: ${Math.round(savingsRate)}%!`,
        description: `Você está guardando ${formatCurrency(monthlyStats.income - monthlyStats.expenses)} este mês. Continue assim para acelerar suas metas.`,
        actionLabel: null,
        actionType: null,
        timestamp: Date.now(),
      });
    } else if (savingsRate > 0 && savingsRate < 10) {
      insights.push({
        id: 'low-savings-rate',
        type: INSIGHT_TYPES.TIP,
        icon: 'Lightbulb',
        title: 'Taxa de economia pode melhorar',
        description: `Você está economizando apenas ${Math.round(savingsRate)}% da renda. O ideal é pelo menos 20%. Tente cortar ${formatCurrency(monthlyStats.income * 0.1)} em gastos variáveis.`,
        actionLabel: 'Ver gastos',
        actionType: 'viewExpenses',
        actionData: {},
        timestamp: Date.now(),
      });
    }
  }

  // ── Dias sem lançamentos (lembrete de registro) ──
  if (transactions.length > 0) {
    const sortedDates = transactions
      .map(t => new Date(t.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b - a);
    
    if (sortedDates.length > 0) {
      const lastTransaction = sortedDates[0];
      const daysSince = Math.floor((now - lastTransaction) / (1000 * 60 * 60 * 24));
      
      if (daysSince >= 5 && daysSince < 15) {
        insights.push({
          id: 'no-recent-transactions',
          type: INSIGHT_TYPES.TIP,
          icon: 'Clock',
          title: `${daysSince} dias sem registrar transações`,
          description: `Seu último lançamento foi há ${daysSince} dias. Manter os registros em dia ajuda o Monex a fazer análises mais precisas.`,
          actionLabel: 'Registrar agora',
          actionType: 'addTransaction',
          actionData: {},
          timestamp: Date.now(),
        });
      } else if (daysSince >= 15) {
        insights.push({
          id: 'no-recent-transactions-warning',
          type: INSIGHT_TYPES.WARNING,
          icon: 'AlertTriangle',
          title: `${daysSince} dias sem lançamentos!`,
          description: `Faz ${daysSince} dias desde seu último registro. Sem dados atualizados, fica difícil acompanhar sua saúde financeira.`,
          actionLabel: 'Registrar agora',
          actionType: 'addTransaction',
          actionData: {},
          timestamp: Date.now(),
        });
      }
    }
  }

  // ── Velocidade de gastos no mês ──
  if (monthlyStats.expenses > 0 && monthlyStats.income > 0) {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const fractionOfMonth = dayOfMonth / daysInMonth;
    const projectedExpenses = monthlyStats.expenses / fractionOfMonth;

    if (fractionOfMonth >= 0.3 && projectedExpenses > monthlyStats.income * 1.1) {
      insights.push({
        id: 'spending-velocity',
        type: INSIGHT_TYPES.WARNING,
        icon: 'TrendingUp',
        title: 'Ritmo de gastos acima da renda',
        description: `No ritmo atual, você vai gastar ~${formatCurrency(projectedExpenses)} até o fim do mês, ${Math.round(((projectedExpenses / monthlyStats.income) - 1) * 100)}% acima da sua renda. Hora de frear!`,
        actionLabel: 'Ver gastos',
        actionType: 'viewExpenses',
        actionData: {},
        timestamp: Date.now(),
      });
    }
  }

  // ── Mês anterior vs atual (comparação) ──
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && t.type === 'expense';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  if (lastMonthExpenses > 0 && monthlyStats.expenses > 0) {
    const diff = monthlyStats.expenses - lastMonthExpenses;
    const pctChange = Math.round((diff / lastMonthExpenses) * 100);

    if (pctChange > 20) {
      insights.push({
        id: 'expenses-increasing',
        type: INSIGHT_TYPES.WARNING,
        icon: 'TrendingUp',
        title: `Gastos ${pctChange}% maiores que o mês passado`,
        description: `Mês atual: ${formatCurrency(monthlyStats.expenses)} vs mês anterior: ${formatCurrency(lastMonthExpenses)}. Aumento de ${formatCurrency(diff)}. Revise onde está gastando mais.`,
        actionLabel: 'Analisar',
        actionType: 'viewExpenses',
        actionData: {},
        timestamp: Date.now(),
      });
    } else if (pctChange < -15) {
      insights.push({
        id: 'expenses-decreasing',
        type: INSIGHT_TYPES.ACHIEVEMENT,
        icon: 'Sparkles',
        title: `Gastos ${Math.abs(pctChange)}% menores que o mês passado!`,
        description: `Você economizou ${formatCurrency(Math.abs(diff))} em relação ao mês anterior. Excelente controle!`,
        actionLabel: null,
        actionType: null,
        timestamp: Date.now(),
      });
    }
  }

  return insights;
}

/**
 * Analisa dívidas e gera insights
 */
function analyzeDebts(debts) {
  const insights = [];

  const today = new Date();
  let totalDebt = 0;
  let overdueCount = 0;

  debts.forEach(debt => {
    const remaining = (debt.totalValue || 0) - (debt.paidValue || 0);
    if (remaining <= 0) return; // dívida quitada
    totalDebt += remaining;

    if (!debt.dueDate) return;
    const due = new Date(debt.dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    // Dívida vencida (atrasada)
    if (diffDays < 0) {
      overdueCount++;
      insights.push({
        id: `debt-overdue-${debt.id}`,
        type: INSIGHT_TYPES.ALERT,
        icon: 'AlertOctagon',
        title: `Dívida "${debt.name}" ATRASADA há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}!`,
        description: `Valor restante: ${formatCurrency(remaining)}. Dívidas em atraso geram multa e juros adicionais. Regularize o quanto antes.`,
        actionLabel: 'Pagar agora',
        actionType: 'payDebt',
        actionData: { debtId: debt.id, debtName: debt.name },
        timestamp: Date.now(),
      });
    } else if (diffDays >= 0 && diffDays <= 7) {
      // Vencimento próximo
      insights.push({
        id: `debt-due-${debt.id}`,
        type: diffDays <= 2 ? INSIGHT_TYPES.ALERT : INSIGHT_TYPES.WARNING,
        icon: 'Calendar',
        title: `Dívida "${debt.name}" ${diffDays === 0 ? 'vence hoje!' : `vence em ${diffDays} dias`}`,
        description: `Valor restante: ${formatCurrency(remaining)}. Pague em dia para evitar juros.`,
        actionLabel: 'Pagar agora',
        actionType: 'payDebt',
        actionData: { debtId: debt.id, debtName: debt.name },
        timestamp: Date.now(),
      });
    }
  });

  // Dívidas com juros altos
  const highInterestDebts = debts.filter(d => d.interestRate && d.interestRate > 5 && (d.paidValue || 0) < (d.totalValue || 0));
  if (highInterestDebts.length > 0) {
    const worstDebt = highInterestDebts.sort((a, b) => b.interestRate - a.interestRate)[0];
    insights.push({
      id: `high-interest-${worstDebt.id}`,
      type: INSIGHT_TYPES.TIP,
      icon: 'TrendingDown',
      title: 'Priorize dívidas com juros altos',
      description: `"${worstDebt.name}" tem ${worstDebt.interestRate}% de juros. Direcione pagamentos extras aqui primeiro para economizar nos juros.`,
      actionLabel: 'Ver dívidas',
      actionType: 'viewDebts',
      actionData: {},
      timestamp: Date.now(),
    });
  }

  // Alerta de múltiplas dívidas atrasadas
  if (overdueCount > 1) {
    insights.push({
      id: 'multiple-overdue',
      type: INSIGHT_TYPES.ALERT,
      icon: 'AlertTriangle',
      title: `${overdueCount} dívidas em atraso!`,
      description: `Você tem ${overdueCount} dívidas vencidas. Priorize as com juros mais altos para reduzir o prejuízo.`,
      actionLabel: 'Ver dívidas',
      actionType: 'viewDebts',
      actionData: {},
      timestamp: Date.now(),
    });
  }

  // Nível de endividamento total
  if (totalDebt > 0) {
    insights.push({
      id: 'total-debt-overview',
      type: totalDebt > 5000 ? INSIGHT_TYPES.ANALYSIS : INSIGHT_TYPES.ANALYSIS,
      icon: 'PieChart',
      title: `Total em dívidas: ${formatCurrency(totalDebt)}`,
      description: `Você tem ${debts.filter(d => (d.paidValue || 0) < (d.totalValue || 0)).length} dívida(s) ativa(s) somando ${formatCurrency(totalDebt)}. Mantenha o controle para evitar bola de neve.`,
      actionLabel: 'Ver dívidas',
      actionType: 'viewDebts',
      actionData: {},
      timestamp: Date.now(),
    });
  }

  // Dívida quitada recentemente (motivacional)
  const paidDebts = debts.filter(d => (d.paidValue || 0) >= (d.totalValue || 0) && d.totalValue > 0);
  if (paidDebts.length > 0) {
    insights.push({
      id: 'debts-paid',
      type: INSIGHT_TYPES.ACHIEVEMENT,
      icon: 'Trophy',
      title: `${paidDebts.length} dívida${paidDebts.length > 1 ? 's' : ''} quitada${paidDebts.length > 1 ? 's' : ''}! 🎉`,
      description: `Parabéns por quitar ${paidDebts.map(d => `"${d.name}"`).join(', ')}. Redirecione esse valor para suas metas!`,
      actionLabel: 'Ver metas',
      actionType: 'viewGoal',
      actionData: {},
      timestamp: Date.now(),
    });
  }

  return insights;
}

/**
 * Analisa cartões de crédito — uso do limite e vencimento de fatura
 */
function analyzeCreditCards(creditCards) {
  const insights = [];
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  creditCards.forEach(card => {
    if (!card.limit || card.limit <= 0) return;
    const usage = ((card.currentBill || 0) / card.limit) * 100;
    const dueDay = parseInt(card.dueDate, 10);

    // ── Uso alto do limite ──
    if (usage > 80) {
      insights.push({
        id: `card-usage-${card.id}`,
        type: usage > 95 ? INSIGHT_TYPES.ALERT : INSIGHT_TYPES.WARNING,
        icon: 'CreditCard',
        title: `Cartão "${card.name}" com uso alto: ${Math.round(usage)}%`,
        description: `Fatura atual: ${formatCurrency(card.currentBill)} de ${formatCurrency(card.limit)}. Usar mais de 30% do limite afeta seu score.`,
        actionLabel: 'Ver cartão',
        actionType: 'viewCreditCard',
        actionData: { cardId: card.id },
        timestamp: Date.now(),
      });
    }

    // ── Vencimento da fatura ──
    if (dueDay && (card.currentBill || 0) > 0) {
      // Calcular próxima data de vencimento
      let dueDate = new Date(currentYear, currentMonth, dueDay);
      // Se o dia de vencimento já passou neste mês, pega o próximo mês
      if (currentDay > dueDay) {
        dueDate = new Date(currentYear, currentMonth + 1, dueDay);
      }
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        insights.push({
          id: `card-due-today-${card.id}`,
          type: INSIGHT_TYPES.ALERT,
          icon: 'Calendar',
          title: `Fatura do "${card.name}" vence HOJE!`,
          description: `Valor da fatura: ${formatCurrency(card.currentBill)}. Pague antes do fim do dia para evitar juros e multa.`,
          actionLabel: 'Ver cartão',
          actionType: 'viewCreditCard',
          actionData: { cardId: card.id },
          timestamp: Date.now(),
        });
      } else if (diffDays <= 3) {
        insights.push({
          id: `card-due-soon-${card.id}`,
          type: INSIGHT_TYPES.ALERT,
          icon: 'Calendar',
          title: `Fatura do "${card.name}" vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`,
          description: `Valor: ${formatCurrency(card.currentBill)}. Vencimento dia ${dueDay}. Programe o pagamento para não atrasar!`,
          actionLabel: 'Ver cartão',
          actionType: 'viewCreditCard',
          actionData: { cardId: card.id },
          timestamp: Date.now(),
        });
      } else if (diffDays <= 7) {
        insights.push({
          id: `card-due-week-${card.id}`,
          type: INSIGHT_TYPES.WARNING,
          icon: 'Calendar',
          title: `Fatura do "${card.name}" em ${diffDays} dias`,
          description: `Valor: ${formatCurrency(card.currentBill)}. Vencimento dia ${dueDay}. Reserve esse valor no seu orçamento.`,
          actionLabel: 'Ver cartão',
          actionType: 'viewCreditCard',
          actionData: { cardId: card.id },
          timestamp: Date.now(),
        });
      }
    }

    // ── Fatura zerada — parabéns ──
    if ((card.currentBill || 0) === 0 && card.limit > 0) {
      insights.push({
        id: `card-clean-${card.id}`,
        type: INSIGHT_TYPES.ACHIEVEMENT,
        icon: 'Sparkles',
        title: `Cartão "${card.name}" sem fatura!`,
        description: `Você está com ${formatCurrency(card.limit)} de limite disponível. Ótimo controle!`,
        actionLabel: null,
        actionType: null,
        timestamp: Date.now(),
      });
    }
  });

  // ── Resumo total de faturas ──
  const totalBills = creditCards.reduce((sum, c) => sum + (c.currentBill || 0), 0);
  const totalLimits = creditCards.reduce((sum, c) => sum + (c.limit || 0), 0);
  if (creditCards.length > 1 && totalBills > 0 && totalLimits > 0) {
    const totalUsage = (totalBills / totalLimits) * 100;
    if (totalUsage > 50) {
      insights.push({
        id: 'cards-total-usage',
        type: INSIGHT_TYPES.ANALYSIS,
        icon: 'PieChart',
        title: `Uso total dos cartões: ${Math.round(totalUsage)}%`,
        description: `Faturas somam ${formatCurrency(totalBills)} de ${formatCurrency(totalLimits)} em limite. Mantenha abaixo de 30% para melhorar seu score.`,
        actionLabel: 'Ver cartões',
        actionType: 'viewCreditCard',
        actionData: {},
        timestamp: Date.now(),
      });
    }
  }

  return insights;
}

/**
 * Função principal que gera todos os insights a partir do estado financeiro
 */
export function generateInsights({ 
  transactions = [], 
  monthlyStats = {}, 
  goals = [], 
  spendingLimits = [],
  debts = [],
  creditCards = [],
  userProfile = null
}) {
  const allInsights = [
    ...analyzeSpendingLimits(spendingLimits),
    ...analyzeGoals(goals),
    ...analyzeTransactions(transactions, monthlyStats),
    ...analyzeDebts(debts),
    ...analyzeCreditCards(creditCards),
  ];

  // Ordena por prioridade (mais urgente primeiro)
  allInsights.sort((a, b) => {
    const priorityA = INSIGHT_PRIORITIES[a.type] || 0;
    const priorityB = INSIGHT_PRIORITIES[b.type] || 0;
    return priorityB - priorityA;
  });

  return allInsights;
}

/**
 * Filtra insights que o usuário já viu/descartou
 */
export function filterDismissedInsights(insights, dismissedIds = []) {
  return insights.filter(insight => !dismissedIds.includes(insight.id));
}

/**
 * Retorna apenas os N insights mais prioritários
 */
export function getTopInsights(insights, count = 5) {
  return insights.slice(0, count);
}
