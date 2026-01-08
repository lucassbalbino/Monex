
import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useFinancialData } from '@/context/FinancialContext';
import { formatCurrency } from '@/lib/utils';

const ProgressView = () => {
  const { goals, debts } = useFinancialData();

  // Calculate Aggregated Debt Stats
  const totalDebtValue = debts.reduce((acc, d) => acc + d.totalValue, 0);
  const totalDebtPaid = debts.reduce((acc, d) => acc + d.paidValue, 0);
  const debtPercentage = totalDebtValue > 0 ? (totalDebtPaid / totalDebtValue) * 100 : 100;

  // Prepare display items: Goals + Aggregated Debt
  const displayItems = [
    ...goals.map(g => ({
      id: g.id,
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount || 0,
      color: g.category === 'Segurança' ? '#14B8A6' : g.category === 'Investimento' ? '#10B981' : '#8B5CF6',
      type: 'goal',
      months: g.months
    })),
    // Only show debt item if there are debts
    ...(debts.length > 0 ? [{
      id: 'aggregated_debts',
      name: 'Pagamento de Dívidas (Total)',
      target: totalDebtValue,
      current: totalDebtPaid,
      color: '#F59E0B', // Amber for Warning/Debt
      type: 'debt',
      months: null // Depends on individual debts
    }] : [])
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Progresso Financeiro</h1>
        <p className="text-gray-400">Acompanhamento consolidado de suas metas e quitação de dívidas.</p>
      </motion.div>

      {displayItems.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B] rounded-xl border border-dashed border-[#334155]">
          <p className="text-gray-400">Nenhum progresso para exibir ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item, index) => {
            const percentage = item.target > 0 ? (item.current / item.target) * 100 : 0;
            const isDebt = item.type === 'debt';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-[#1E293B] rounded-xl border p-6 transition-all duration-300 ${
                  isDebt ? 'border-amber-500/30 hover:border-amber-500' : 'border-[#334155] hover:border-[#14B8A6]'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {isDebt ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Target className="h-5 w-5" style={{ color: item.color }} />
                  )}
                  <h3 className="text-white font-bold truncate">{item.name}</h3>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold text-white">{formatCurrency(item.current)}</span>
                    <span className="text-xs text-gray-400">de {formatCurrency(item.target)}</span>
                  </div>
                  <div className="relative h-3 bg-[#0F172A] rounded-full overflow-hidden border border-[#334155]/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                      className="absolute h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className={`font-medium ${isDebt ? 'text-amber-400' : 'text-gray-400'}`}>
                    {percentage.toFixed(1)}% {isDebt ? 'quitado' : 'concluído'}
                  </span>
                  {item.months && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs bg-[#0F172A] px-2 py-1 rounded">
                      <span>Meta: {item.months} meses</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {debts.length > 0 && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="bg-[#1E293B]/50 p-4 rounded-lg border border-[#334155] flex items-start gap-3"
         >
           <div className="p-2 bg-amber-500/10 rounded-full">
             <TrendingUp className="h-5 w-5 text-amber-500" />
           </div>
           <div>
             <h4 className="text-sm font-bold text-white">Sincronização Ativa</h4>
             <p className="text-xs text-gray-400 mt-1">
               O progresso das dívidas é atualizado automaticamente conforme você registra pagamentos no menu <strong>Dívidas</strong>.
             </p>
           </div>
         </motion.div>
      )}
    </div>
  );
};

export default ProgressView;
