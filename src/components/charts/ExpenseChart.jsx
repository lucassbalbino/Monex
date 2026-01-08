import React from 'react';
import { motion } from 'framer-motion';

const ExpenseChart = () => {
  const categories = [
    { name: 'Mercado', amount: 450, percentage: 30, color: '#14B8A6' },
    { name: 'Entretenimento', amount: 250, percentage: 17, color: '#8B5CF6' },
    { name: 'Transporte', amount: 350, percentage: 23, color: '#F59E0B' },
    { name: 'Contas', amount: 200, percentage: 13, color: '#10B981' },
    { name: 'Outros', amount: 250, percentage: 17, color: '#6366F1' }
  ];

  return (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6">
      <h2 className="text-xl font-bold text-white mb-6">Categorias de Despesas</h2>
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
    </div>
  );
};

export default ExpenseChart;