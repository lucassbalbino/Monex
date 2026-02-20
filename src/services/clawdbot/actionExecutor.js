/**
 * Monex Action Executor
 * 
 * Executa ações sugeridas pelo Monex no contexto financeiro do usuário.
 * Ponte entre insights/chat e as funções do FinancialContext.
 */

/**
 * Define todas as ações que o Monex pode executar
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
 * Helpers para extração de dados da mensagem
 */
function extractMoney(msg) {
  const match = msg.match(/r?\$\s*([\d.,]+)/i) || msg.match(/([\d.]+,\d{2})/);
  if (!match) return null;
  return match[1].replace(/\./g, '').replace(',', '.');
}

function extractName(msg, prefixes) {
  for (const prefix of prefixes) {
    const match = msg.match(new RegExp(`${prefix}\\s+(.+?)(?:\\s+(?:de|no valor|com|por|r\\$|$))`, 'i'));
    if (match) return match[1].trim().replace(/["']/g, '');
  }
  return null;
}

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Parseia comandos de texto do chat para detectar intenções de ação.
 * Retorna { detected, action, data, rawMessage } com dados pré-extraídos.
 */
export function parseActionFromChat(message) {
  const norm = normalizeText(message);
  const original = message.trim();

  // ── Metas ──────────────────────────────────────────────
  // "criar meta", "quero criar uma meta", "nova meta", "definir meta",
  // "estabelecer meta", "adicionar meta", "cadastrar meta"
  if (/(?:cri(?:ar?|e)|nov[oa]|defin(?:ir|a)|estabelec(?:er|a)|adicion(?:ar|e)|cadastr(?:ar|e))\s+(?:uma?\s+)?meta/i.test(norm)) {
    const name = extractName(original, ['meta\\s+(?:de|para|chamada)', 'meta']);
    const amount = extractMoney(original);
    return {
      detected: true,
      action: 'createGoal',
      data: {
        ...(name && { name }),
        ...(amount && { targetAmount: amount }),
      },
      rawMessage: original,
    };
  }

  // "adicionar/depositar/colocar R$X na/à meta"
  if (/(?:adicion(?:ar|e)|deposit(?:ar|e)|coloc(?:ar|a)|guard(?:ar|e)|por|bot(?:ar|e))\s+.{0,30}(?:na|a|à)\s+meta/i.test(norm)) {
    const amount = extractMoney(original);
    return {
      detected: true,
      action: 'addToGoal',
      data: { ...(amount && { amount }) },
      rawMessage: original,
    };
  }

  // ── Dívidas ────────────────────────────────────────────
  // "pagar dívida", "quitar dívida", "amortizar", "abater dívida",
  // "registrar pagamento de dívida"
  if (/(?:pag(?:ar|ue)|quit(?:ar|e)|amortiz(?:ar|e)|abat(?:er|a))\s+(?:uma?\s+)?(?:a\s+)?d[ií]vida/i.test(norm)
    || /registr(?:ar|e)\s+(?:um?\s+)?pagamento\s+(?:de|da)\s+d[ií]vida/i.test(norm)
    || /(?:quero|gostaria\s+de|preciso|vou)\s+(?:pagar|quitar)\s+(?:uma?\s+)?d[ií]vida/i.test(norm)) {
    const amount = extractMoney(original);
    return {
      detected: true,
      action: 'payDebt',
      data: { ...(amount && { amount }) },
      rawMessage: original,
    };
  }

  // ── Limites ────────────────────────────────────────────
  // "criar limite", "novo limite", "definir limite", "estabelecer limite",
  // "ajustar limite", "alterar limite", "mudar limite", "atualizar limite"
  if (/(?:ajust(?:ar|e)|alter(?:ar|e)|mud(?:ar|e)|atualiz(?:ar|e)|modific(?:ar|e))\s+(?:o\s+)?(?:um?\s+)?limite/i.test(norm)) {
    const amount = extractMoney(original);
    const category = extractName(original, ['limite\\s+(?:de|do|da|para)', 'limite']);
    return {
      detected: true,
      action: 'adjustLimit',
      data: {
        ...(amount && { newLimit: amount }),
        ...(category && { category }),
      },
      rawMessage: original,
    };
  }

  if (/(?:cri(?:ar?|e)|nov[oa]|defin(?:ir|a)|estabelec(?:er|a)|adicion(?:ar|e)|cadastr(?:ar|e)|coloc(?:ar|a))\s+(?:um?\s+)?limite/i.test(norm)) {
    const amount = extractMoney(original);
    const category = extractName(original, ['limite\\s+(?:de|do|da|para)', 'limite']);
    return {
      detected: true,
      action: 'createLimit',
      data: {
        ...(amount && { limit: amount }),
        ...(category && { category }),
      },
      rawMessage: original,
    };
  }

  // ── Transações ─────────────────────────────────────────
  // "registrar despesa/gasto/receita/entrada/saída", "adicionar despesa",
  // "lançar gasto", "anotar despesa", "incluir receita", "cadastrar gasto"
  if (/(?:registr(?:ar|e)|adicion(?:ar|e)|lanc(?:ar|e)|anot(?:ar|e)|inclu(?:ir|a)|cadastr(?:ar|e)|nov[oa])\s+(?:uma?\s+)?(?:despesa|gasto|receita|entrada|saida|transac(?:ao|ão))/i.test(norm)
    || /(?:gastei|paguei|recebi|ganhei)\s+(?:r?\$\s*)?([\d.,]+)/i.test(norm)) {
    const amount = extractMoney(original);
    const isIncome = /(?:receita|entrada|recebi|ganhei)/i.test(norm);
    const description = extractName(original, ['(?:de|com|em|no|na|para)']);
    return {
      detected: true,
      action: 'addTransaction',
      data: {
        type: isIncome ? 'income' : 'expense',
        ...(amount && { amount }),
        ...(description && { description }),
      },
      rawMessage: original,
    };
  }

  // ── Navegação ──────────────────────────────────────────
  // "ver/mostrar/abrir/ir para + seção"
  const navPatterns = [
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:as?\s+|os?\s+|meu[s]?\s+|minha[s]?\s+)?(?:d[ií]vidas?|d[eé]bitos?)/i, action: 'viewDebts' },
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:o\s+|meu\s+)?(?:resumo|sum[aá]rio)/i, action: 'viewSummary' },
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:os?\s+|meu[s]?\s+|minha[s]?\s+)?(?:gastos?|despesas?|extrato)/i, action: 'viewExpenses' },
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:as?\s+|minha[s]?\s+)?(?:transac(?:ão|ões|ao|oes)|movimentac(?:ão|ões|ao|oes))/i, action: 'viewTransactions' },
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:o[s]?\s+|meu[s]?\s+)?(?:cart(?:ão|ao|ões|oes)(?:\s+de\s+cr[eé]dito)?|cart[oõ]es)/i, action: 'viewCreditCard' },
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:as?\s+|minha[s]?\s+)?(?:metas?|objetivos?|progresso)/i, action: 'viewGoal' },
    { regex: /(?:ver|mostr(?:ar|e)|abr(?:ir|a)|ir\s+(?:para|pra)|exib(?:ir|a)|acess(?:ar|e))\s+(?:os?\s+|meu[s]?\s+)?(?:limites?|tetos?)/i, action: 'viewCategory' },
  ];

  for (const nav of navPatterns) {
    if (nav.regex.test(norm)) {
      return { detected: true, action: nav.action, data: {}, rawMessage: original };
    }
  }

  return { detected: false };
}
