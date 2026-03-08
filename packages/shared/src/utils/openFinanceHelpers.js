/**
 * Helpers para normalização e formatação de dados do Open Finance.
 * Centraliza lógica de apresentação para evitar repetição entre componentes.
 */

import { formatCurrency, formatDate } from './formatters';

// ─── Tipos de Conta ─────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABELS = {
  BANK: 'Conta Corrente',
  CREDIT: 'Cartão de Crédito',
  INVESTMENT: 'Investimento',
  SAVINGS: 'Poupança',
};

export function getAccountTypeLabel(type) {
  return ACCOUNT_TYPE_LABELS[type] || type;
}

// ─── Cores de Instituições ──────────────────────────────────────────────────

const INSTITUTION_COLORS = {
  nubank: '#820AD1',
  inter: '#FF7A00',
  itau: '#003399',
  'itaú': '#003399',
  bradesco: '#CC092F',
  santander: '#EC0000',
  'c6 bank': '#2A2A2A',
  c6: '#2A2A2A',
  'banco do brasil': '#FFEF00',
  bb: '#FFEF00',
  caixa: '#005CA9',
  'caixa economica': '#005CA9',
  btg: '#1A1A2E',
  'btg pactual': '#1A1A2E',
  neon: '#0066FF',
  next: '#00E676',
  picpay: '#21C25E',
  mercadopago: '#009EE3',
  'mercado pago': '#009EE3',
  pan: '#0066CC',
  'banco pan': '#0066CC',
  original: '#00A651',
  'banco original': '#00A651',
  safra: '#003366',
  'banco safra': '#003366',
  sicoob: '#003641',
  sicredi: '#66A844',
  will: '#E91E63',
  'will bank': '#E91E63',
};

export function getInstitutionColor(institutionName) {
  if (!institutionName) return '#14B8A6';
  const key = institutionName.toLowerCase().trim();
  
  for (const [name, color] of Object.entries(INSTITUTION_COLORS)) {
    if (key.includes(name)) return color;
  }
  
  return '#14B8A6'; // fallback teal (cor primária do Monex)
}

// ─── Ícones de Categoria de Transação ───────────────────────────────────────

const TRANSACTION_CATEGORY_MAP = {
  // Alimentação
  'food': { icon: 'restaurant-outline', label: 'Alimentação', color: '#F59E0B' },
  'restaurant': { icon: 'restaurant-outline', label: 'Alimentação', color: '#F59E0B' },
  'groceries': { icon: 'cart-outline', label: 'Supermercado', color: '#F59E0B' },
  'supermarket': { icon: 'cart-outline', label: 'Supermercado', color: '#F59E0B' },
  // Transporte
  'transport': { icon: 'car-outline', label: 'Transporte', color: '#3B82F6' },
  'travel': { icon: 'airplane-outline', label: 'Viagem', color: '#3B82F6' },
  'uber': { icon: 'car-outline', label: 'Transporte', color: '#3B82F6' },
  // Moradia
  'housing': { icon: 'home-outline', label: 'Moradia', color: '#8B5CF6' },
  'rent': { icon: 'home-outline', label: 'Aluguel', color: '#8B5CF6' },
  'utilities': { icon: 'flash-outline', label: 'Contas', color: '#8B5CF6' },
  // Saúde
  'health': { icon: 'heart-outline', label: 'Saúde', color: '#EF4444' },
  'pharmacy': { icon: 'medkit-outline', label: 'Farmácia', color: '#EF4444' },
  // Educação
  'education': { icon: 'school-outline', label: 'Educação', color: '#06B6D4' },
  // Lazer
  'entertainment': { icon: 'game-controller-outline', label: 'Lazer', color: '#A855F7' },
  'streaming': { icon: 'play-circle-outline', label: 'Streaming', color: '#A855F7' },
  // Compras
  'shopping': { icon: 'bag-outline', label: 'Compras', color: '#EC4899' },
  'clothing': { icon: 'shirt-outline', label: 'Vestuário', color: '#EC4899' },
  // Serviços
  'services': { icon: 'construct-outline', label: 'Serviços', color: '#F97316' },
  'subscription': { icon: 'card-outline', label: 'Assinatura', color: '#F97316' },
  // Financeiro
  'transfer': { icon: 'swap-horizontal-outline', label: 'Transferência', color: '#14B8A6' },
  'pix': { icon: 'swap-horizontal-outline', label: 'Pix', color: '#14B8A6' },
  'payment': { icon: 'cash-outline', label: 'Pagamento', color: '#22C55E' },
  'salary': { icon: 'wallet-outline', label: 'Salário', color: '#22C55E' },
  'income': { icon: 'trending-up-outline', label: 'Receita', color: '#22C55E' },
};

const DEFAULT_CATEGORY = { icon: 'ellipsis-horizontal-outline', label: 'Outros', color: '#64748B' };

export function getTransactionCategory(category, description = '') {
  if (category) {
    const key = category.toLowerCase();
    if (TRANSACTION_CATEGORY_MAP[key]) return TRANSACTION_CATEGORY_MAP[key];
  }
  
  // Tenta inferir pela descrição
  if (description) {
    const desc = description.toLowerCase();
    for (const [key, value] of Object.entries(TRANSACTION_CATEGORY_MAP)) {
      if (desc.includes(key)) return value;
    }
  }
  
  return DEFAULT_CATEGORY;
}

// ─── Formatação de Transações ───────────────────────────────────────────────

export function formatTransactionAmount(amount, type) {
  const formatted = formatCurrency(Math.abs(amount));
  if (type === 'CREDIT' || amount > 0) return `+${formatted}`;
  return `-${formatted}`;
}

export function isIncome(transaction) {
  return transaction.type === 'CREDIT' || transaction.amount > 0;
}

// ─── Status de Conexão ──────────────────────────────────────────────────────

const CONNECTION_STATUS = {
  UPDATED: { label: 'Atualizado', color: '#22C55E', icon: 'checkmark-circle' },
  UPDATING: { label: 'Atualizando...', color: '#F59E0B', icon: 'sync-outline' },
  WAITING_USER_INPUT: { label: 'Ação necessária', color: '#F59E0B', icon: 'alert-circle' },
  LOGIN_ERROR: { label: 'Erro de login', color: '#EF4444', icon: 'close-circle' },
  OUTDATED: { label: 'Desatualizado', color: '#64748B', icon: 'time-outline' },
};

export function getConnectionStatus(status) {
  return CONNECTION_STATUS[status] || CONNECTION_STATUS.OUTDATED;
}

// ─── Agrupamento de Transações por Data ─────────────────────────────────────

export function groupTransactionsByDate(transactions) {
  const groups = {};
  
  for (const tx of transactions) {
    const dateKey = tx.date?.split('T')[0] || 'unknown';
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        label: formatDate(new Date(dateKey + 'T12:00:00')),
        transactions: [],
        totalIncome: 0,
        totalExpense: 0,
      };
    }
    groups[dateKey].transactions.push(tx);
    if (isIncome(tx)) {
      groups[dateKey].totalIncome += Math.abs(tx.amount);
    } else {
      groups[dateKey].totalExpense += Math.abs(tx.amount);
    }
  }
  
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Resumo de Saldo por Banco ──────────────────────────────────────────────

export function groupAccountsByInstitution(accounts) {
  const groups = {};
  
  for (const account of accounts) {
    const institution = account.open_finance_connections?.institution_name || 'Desconhecido';
    if (!groups[institution]) {
      groups[institution] = {
        institution,
        logo: account.open_finance_connections?.institution_logo,
        color: getInstitutionColor(institution),
        accounts: [],
        totalBalance: 0,
      };
    }
    groups[institution].accounts.push(account);
    groups[institution].totalBalance += account.balance || 0;
  }
  
  return Object.values(groups).sort((a, b) => b.totalBalance - a.totalBalance);
}
