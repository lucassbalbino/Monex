/**
 * ClawdBot Action Executor
 * 
 * Executa ações sugeridas pelo ClawdBot no contexto financeiro do usuário.
 * Ponte entre insights/chat e as funções do FinancialContext.
 */

/**
 * Define todas as ações que o ClawdBot pode executar
 */
export const CLAWDBOT_ACTIONS = {
  // Limites
  adjustLimit: {
    name: 'Ajustar Limite',
    requiresConfirmation: true,
    description: 'Ajustar o valor de um limite de gastos',
  },
  createLimit: {
    name: 'Criar Limite',
    requiresConfirmation: true,
    description: 'Criar um novo limite de gastos para uma categoria',
  },

  // Metas
  createGoal: {
    name: 'Criar Meta',
    requiresConfirmation: true,
    description: 'Criar uma nova meta financeira',
  },
  addToGoal: {
    name: 'Adicionar à Meta',
    requiresConfirmation: true,
    description: 'Adicionar valor a uma meta existente',
  },
  viewGoal: {
    name: 'Ver Meta',
    requiresConfirmation: false,
    description: 'Navegar para uma meta específica',
  },

  // Dívidas
  payDebt: {
    name: 'Pagar Dívida',
    requiresConfirmation: true,
    description: 'Realizar pagamento de uma dívida',
  },
  viewDebts: {
    name: 'Ver Dívidas',
    requiresConfirmation: false,
    description: 'Navegar para a seção de dívidas',
  },

  // Navegação
  viewCategory: {
    name: 'Ver Categoria',
    requiresConfirmation: false,
    description: 'Navegar para detalhes de uma categoria',
  },
  viewSummary: {
    name: 'Ver Resumo',
    requiresConfirmation: false,
    description: 'Navegar para o resumo financeiro',
  },
  viewExpenses: {
    name: 'Ver Gastos',
    requiresConfirmation: false,
    description: 'Navegar para a seção de gastos',
  },
  viewTransactions: {
    name: 'Ver Transações',
    requiresConfirmation: false,
    description: 'Navegar para as transações',
  },
  viewCreditCard: {
    name: 'Ver Cartão',
    requiresConfirmation: false,
    description: 'Navegar para um cartão de crédito',
  },

  // Transações
  addTransaction: {
    name: 'Registrar Transação',
    requiresConfirmation: true,
    description: 'Criar uma nova transação (receita ou despesa)',
  },
};

/**
 * Mapa de ações para seções do dashboard
 */
const ACTION_TO_SECTION = {
  viewCategory: 'spending-limits',
  viewSummary: 'summaries',
  viewExpenses: 'tracking',
  viewTransactions: 'tracking',
  viewDebts: 'debt-tips',
  viewCreditCard: 'credit-cards',
  viewGoal: 'progress',
};

/**
 * Executa uma ação que NÃO requer confirmação (navegação)
 */
export function executeNavigationAction(actionType, actionData, setActiveSection) {
  const section = ACTION_TO_SECTION[actionType];
  if (section && setActiveSection) {
    setActiveSection(section);
    return { success: true, message: `Navegando para ${section}` };
  }
  return { success: false, message: 'Seção não encontrada' };
}

/**
 * Executa uma ação que requer confirmação
 * Retorna o resultado da execução
 */
export async function executeConfirmedAction(actionType, actionData, financialActions) {
  try {
    switch (actionType) {
      case 'adjustLimit': {
        const { limitId, newLimit } = actionData;
        if (limitId && newLimit && financialActions.updateSpendingLimit) {
          await financialActions.updateSpendingLimit(limitId, { limit: parseFloat(newLimit) });
          return { success: true, message: `Limite ajustado para ${newLimit}` };
        }
        return { success: false, message: 'Dados insuficientes para ajustar o limite' };
      }

      case 'createLimit': {
        const { category, limit, period } = actionData;
        if (category && limit && financialActions.addSpendingLimit) {
          await financialActions.addSpendingLimit({
            name: `Limite ${category}`,
            category,
            limit: parseFloat(limit),
            period: period || 'Mensal',
          });
          return { success: true, message: `Limite de ${category} criado com sucesso` };
        }
        return { success: false, message: 'Dados insuficientes para criar limite' };
      }

      case 'createGoal': {
        const { name, targetAmount, months, category } = actionData;
        if (name && targetAmount && financialActions.addGoal) {
          await financialActions.addGoal({
            id: `goal_${Date.now()}`,
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: 0,
            months: months || 12,
            category: category || 'Outro',
          });
          return { success: true, message: `Meta "${name}" criada com sucesso` };
        }
        return { success: false, message: 'Dados insuficientes para criar meta' };
      }

      case 'addToGoal': {
        const { goalId, amount } = actionData;
        if (goalId && amount && financialActions.modifyGoal) {
          const currentGoal = financialActions.goals?.find(g => g.id === goalId);
          if (currentGoal) {
            const newAmount = (currentGoal.currentAmount || 0) + parseFloat(amount);
            await financialActions.modifyGoal(goalId, { currentAmount: newAmount });
            return { success: true, message: `Adicionado ${amount} à meta` };
          }
        }
        return { success: false, message: 'Meta não encontrada' };
      }

      case 'payDebt': {
        const { debtId, amount } = actionData;
        if (debtId && amount && financialActions.payDebt) {
          await financialActions.payDebt(debtId, parseFloat(amount));
          return { success: true, message: `Pagamento de ${amount} registrado` };
        }
        return { success: false, message: 'Dados insuficientes para pagamento' };
      }

      case 'addTransaction': {
        const { type, amount, description, category } = actionData;
        if (type && amount && financialActions.addTransaction) {
          await financialActions.addTransaction({
            type,
            amount: parseFloat(amount),
            date: new Date().toISOString().split('T')[0],
            description: description || '',
            category: category || 'Outros',
          });
          return { success: true, message: `Transação de ${amount} registrada` };
        }
        return { success: false, message: 'Dados insuficientes para transação' };
      }

      default:
        return { success: false, message: `Ação "${actionType}" não reconhecida` };
    }
  } catch (error) {
    return { success: false, message: `Erro ao executar ação: ${error.message}` };
  }
}

/**
 * Verifica se uma ação requer confirmação do usuário
 */
export function requiresConfirmation(actionType) {
  return CLAWDBOT_ACTIONS[actionType]?.requiresConfirmation ?? true;
}

/**
 * Parseia comandos de texto do chat para detectar intenções de ação
 */
export function parseActionFromChat(message) {
  const lowerMsg = message.toLowerCase();

  // Padrões simples de detecção de intenção
  const patterns = [
    { regex: /criar?\s+(uma?\s+)?meta\s+(?:de\s+)?(.+?)(?:\s+de\s+)?r?\$?\s*([\d.,]+)/i, action: 'createGoal' },
    { regex: /adicionar?\s+r?\$?\s*([\d.,]+)\s+(?:na|à|a)\s+meta/i, action: 'addToGoal' },
    { regex: /pagar?\s+(?:a\s+)?d[ií]vida/i, action: 'payDebt' },
    { regex: /criar?\s+(um?\s+)?limite/i, action: 'createLimit' },
    { regex: /registrar?\s+(uma?\s+)?(?:despesa|gasto)/i, action: 'addTransaction' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(lowerMsg)) {
      return { detected: true, action: pattern.action, rawMessage: message };
    }
  }

  return { detected: false };
}
