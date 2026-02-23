/**
 * Constantes compartilhadas — Monex
 */

/**
 * Itens do menu principal (sidebar) — usados em web e mobile
 */
export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'challenges', label: 'Desafios', icon: 'Trophy' },
  { id: 'credit-cards', label: 'Cartão de Crédito', icon: 'CreditCard' },
  { id: 'tracking', label: 'Rastreamento', icon: 'Receipt' },
  { id: 'spending-limits', label: 'Limites', icon: 'Target' },
  { id: 'conscious-spending', label: 'Gastos Conscientes', icon: 'Lightbulb' },
  { id: 'summaries', label: 'Resumos', icon: 'FileText' },
  { id: 'progress', label: 'Progresso', icon: 'TrendingUp' },
  { id: 'debt-tips', label: 'Dívidas', icon: 'LifeBuoy' },
  { id: 'emotional-progress', label: 'Progresso Emocional', icon: 'Heart', status: 'dev' },
];

/**
 * Metas fixas padrão
 */
export const FIXED_GOALS = [
  {
    name: 'Reserva de Emergência',
    description: 'Fundo essencial para cobrir 3-6 meses de despesas em caso de imprevistos.',
    targetAmount: 15000,
    currentAmount: 0,
    months: 12,
    isDefault: true,
  },
  {
    name: 'Investimentos',
    description: 'Reserve uma parte da sua renda para investir e fazer seu dinheiro trabalhar para você.',
    targetAmount: 10000,
    currentAmount: 0,
    months: 12,
    isDefault: true,
  },
];

/**
 * Categorias de gastos disponíveis
 */
export const EXPENSE_CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', icon: 'UtensilsCrossed', color: '#F59E0B' },
  { id: 'transporte', label: 'Transporte', icon: 'Car', color: '#3B82F6' },
  { id: 'moradia', label: 'Moradia', icon: 'Home', color: '#8B5CF6' },
  { id: 'saude', label: 'Saúde', icon: 'Heart', color: '#EF4444' },
  { id: 'educacao', label: 'Educação', icon: 'GraduationCap', color: '#14B8A6' },
  { id: 'lazer', label: 'Lazer', icon: 'Gamepad2', color: '#EC4899' },
  { id: 'compras', label: 'Compras', icon: 'ShoppingBag', color: '#F97316' },
  { id: 'servicos', label: 'Serviços', icon: 'Wrench', color: '#6366F1' },
  { id: 'outros', label: 'Outros', icon: 'MoreHorizontal', color: '#64748B' },
];
