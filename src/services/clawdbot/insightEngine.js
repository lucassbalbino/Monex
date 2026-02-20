/**
 * ClawdBot Insight Engine
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

  goals.forEach(goal => {
    if (!goal.targetAmount || goal.targetAmount <= 0) return;
    const progress = (goal.currentAmount / goal.targetAmount) * 100;

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
        description: `Faltam apenas ${formatCurrency(goal.targetAmount - goal.currentAmount)} para completar essa meta.`,
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
  });

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

  return insights;
}

/**
 * Analisa dívidas e gera insights
 */
function analyzeDebts(debts) {
  const insights = [];

  // Dívidas com vencimento próximo
  const today = new Date();
  debts.forEach(debt => {
    if (!debt.dueDate) return;
    const due = new Date(debt.dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7 && debt.paidValue < debt.totalValue) {
      insights.push({
        id: `debt-due-${debt.id}`,
        type: diffDays <= 2 ? INSIGHT_TYPES.ALERT : INSIGHT_TYPES.WARNING,
        icon: 'Calendar',
        title: `Dívida "${debt.name}" ${diffDays === 0 ? 'vence hoje!' : `vence em ${diffDays} dias`}`,
        description: `Valor restante: ${formatCurrency(debt.totalValue - (debt.paidValue || 0))}. Pague em dia para evitar juros.`,
        actionLabel: 'Pagar agora',
        actionType: 'payDebt',
        actionData: { debtId: debt.id, debtName: debt.name },
        timestamp: Date.now(),
      });
    }
  });

  // Dívidas com juros altos
  const highInterestDebts = debts.filter(d => d.interestRate && d.interestRate > 5 && d.paidValue < d.totalValue);
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

  return insights;
}

/**
 * Analisa cartões de crédito
 */
function analyzeCreditCards(creditCards) {
  const insights = [];

  creditCards.forEach(card => {
    if (!card.limit || card.limit <= 0) return;
    const usage = ((card.currentBill || 0) / card.limit) * 100;

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
  });

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
