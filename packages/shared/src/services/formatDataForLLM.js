/**
 * Format Data for LLM — Monex (compartilhado)
 * Serializa dados financeiros em Markdown para prompt de IA
 */
import { formatCurrency } from '../utils/formatters';

/**
 * Formata todos os dados financeiros em um prompt Markdown para LLM
 * @param {object} params
 * @returns {string}
 */
export const formatDataForLLM = ({
  client,
  creditCards = [],
  debts = [],
  expenses = [],
  summary,
  goals = [],
  payments = [],
  limits = [],
}) => {
  const sections = [];

  if (client) {
    sections.push(`## Perfil do Cliente\n- Nome: ${client.name || 'N/A'}\n- Email: ${client.email || 'N/A'}`);
  }

  if (creditCards.length > 0) {
    const cards = creditCards
      .map((c) => `- ${c.name || 'Cartão'}: Limite ${formatCurrency(c.limit)} | Fatura ${formatCurrency(c.bill)}`)
      .join('\n');
    sections.push(`## Cartões de Crédito\n${cards}`);
  }

  if (debts.length > 0) {
    const debtList = debts
      .map((d) => `- ${d.name}: ${formatCurrency(d.amount)} (${d.status || 'pendente'})`)
      .join('\n');
    sections.push(`## Dívidas\n${debtList}`);
  }

  if (expenses.length > 0) {
    const expList = expenses
      .map((e) => `- ${e.description || e.category}: ${formatCurrency(e.amount)}`)
      .join('\n');
    sections.push(`## Despesas Recentes\n${expList}`);
  }

  if (summary) {
    sections.push(
      `## Resumo Financeiro\n- Renda: ${formatCurrency(summary.income)}\n- Despesas: ${formatCurrency(summary.expenses)}\n- Saldo: ${formatCurrency(summary.balance)}`
    );
  }

  if (goals.length > 0) {
    const goalList = goals
      .map((g) => `- ${g.name}: ${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)}`)
      .join('\n');
    sections.push(`## Metas\n${goalList}`);
  }

  if (limits.length > 0) {
    const limitList = limits
      .map((l) => `- ${l.category}: Limite ${formatCurrency(l.limit)} | Gasto ${formatCurrency(l.spent)}`)
      .join('\n');
    sections.push(`## Limites de Gastos\n${limitList}`);
  }

  return sections.join('\n\n');
};
