import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinancialData } from '@/context/FinancialContext';

const CATEGORY_COLORS = {
  'Mercado': '#14B8A6',
  'Lazer e Hobbies': '#8B5CF6',
  'Transporte': '#F59E0B',
  'Contas': '#10B981',
  'Alimentação': '#EF4444',
  'Saúde': '#3B82F6',
  'Educação': '#6366F1',
  'Moradia': '#EC4899',
  'Cartão de Crédito': '#F97316',
  'Dívidas': '#DC2626',
  'Outros': '#94A3B8',
};

const ExpenseChart = () => {
  const { transactions } = useFinancialData();

  const categories = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totals = {};
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const [year, month] = (t.date || '').split('-').map(Number);
      if (year !== currentYear || (month - 1) !== currentMonth) return;

      const amount = parseFloat(t.amount) || 0;
      const cat = t.category || 'Outros';
      totals[cat] = (totals[cat] || 0) + amount;
      totalExpenses += amount;
    });

    if (totalExpenses === 0) return [];

    return Object.entries(totals)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round((amount / totalExpenses) * 100),
        color: CATEGORY_COLORS[name] || '#94A3B8',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6">
      <h2 className="text-xl font-bold text-white mb-6">Categorias de Despesas</h2>
      {categories.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">Nenhuma despesa registrada neste mês.</p>
      ) : (
      <div className="space-y-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">{category.name}</span>
              <span className="text-sm font-bold text-white">R$ {category.amount}</span>
            </div>
            <div className="relative h-3 bg-[#334155] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${category.percentage}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                className="absolute h-full rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{category.percentage}% das despesas totais</p>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ExpenseChart;