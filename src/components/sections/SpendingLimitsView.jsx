
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFinancialData } from '@/context/FinancialContext';
import { CreateLimitForm, EditLimitForm } from '@/components/forms/LimitForms';
import { formatCurrency } from '@/lib/utils';

const SpendingLimitsView = () => {
  const { spendingLimits } = useFinancialData();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingLimit, setEditingLimit] = useState(null);

  const getStatus = (spent, limit) => {
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    if (percentage >= 100) return 'excedido';
    if (percentage >= 80) return 'aviso';
    return 'seguro';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Limites de Gastos</h1>
          <p className="text-gray-400">Defina e monitore seus limites de gastos por categoria</p>
        </div>
        
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2">
              <Plus className="h-5 w-5" />
              Criar Limite
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle>Novo Limite de Gastos</DialogTitle>
            </DialogHeader>
            <CreateLimitForm onSuccess={() => setOpenCreate(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spendingLimits.map((limit, index) => {
          const status = getStatus(limit.spent, limit.limit);
          const percentage = limit.limit > 0 ? (limit.spent / limit.limit) * 100 : 0;
          
          return (
            <motion.div
              key={limit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-[#1E293B] rounded-xl border p-6 transition-all duration-300 ${status === 'excedido' ? 'border-red-500/50' : 'border-[#334155] hover:border-[#14B8A6]'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{limit.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs bg-[#0F172A] px-2 py-0.5 rounded text-gray-400 border border-[#334155]">{limit.category}</span>
                     <span className="text-xs text-gray-500">• {limit.period}</span>
                  </div>
                </div>
                
                <Dialog open={editingLimit?.id === limit.id} onOpenChange={(open) => !open && setEditingLimit(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingLimit(limit)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                    <DialogHeader>
                      <DialogTitle>Configurar Limite: {limit.name}</DialogTitle>
                    </DialogHeader>
                    <EditLimitForm limitData={limit} onSuccess={() => setEditingLimit(null)} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative h-4 bg-[#334155] rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                  className={`absolute h-full rounded-full ${status === 'excedido' ? 'bg-red-500' : status === 'aviso' ? 'bg-orange-500' : 'bg-teal-500'}`}
                />
              </div>

              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400 font-medium">
                  Gasto: {formatCurrency(limit.spent || 0)}
                </span>
                <span className="text-xs font-bold text-white">
                  Meta: {formatCurrency(limit.limit || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                 <span className={`text-xs ${status === 'excedido' ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                   {percentage.toFixed(1)}% utilizado
                 </span>
                 <span className="text-xs font-medium" style={{ color: status === 'excedido' ? '#EF4444' : '#10B981' }}>
                  {limit.limit - limit.spent >= 0 
                    ? `${formatCurrency(limit.limit - limit.spent)} restante`
                    : `Excedido em ${formatCurrency(limit.spent - limit.limit)}`
                  }
                </span>
              </div>

              {status === 'aviso' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 p-2 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  Atenção: Você atingiu 80% do seu limite.
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {spendingLimits.length === 0 && (
         <div className="text-center py-12 bg-[#1E293B] border border-dashed border-[#334155] rounded-xl">
           <div className="w-12 h-12 bg-[#334155] rounded-full flex items-center justify-center mx-auto mb-4">
             <Settings className="h-6 w-6 text-gray-400" />
           </div>
           <h3 className="text-lg font-medium text-white mb-1">Nenhum limite definido</h3>
           <p className="text-gray-400 text-sm max-w-sm mx-auto mb-4">Crie limites de gastos para categorias específicas e mantenha seu orçamento sob controle.</p>
           <Button onClick={() => setOpenCreate(true)} className="bg-[#14B8A6] hover:bg-[#0D9488] text-white">
             Criar Primeiro Limite
           </Button>
         </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-[#14B8A6]/20 to-[#10B981]/20 rounded-xl border border-[#14B8A6]/30 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-2">Dicas de Gastos Inteligentes</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-[#14B8A6] mt-1">•</span>
            Defina limites realistas baseados na sua renda e despesas essenciais
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-[#14B8A6] mt-1">•</span>
            Revise e ajuste seus limites mensalmente para acompanhar mudanças no seu estilo de vida
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-[#14B8A6] mt-1">•</span>
            Seus limites mensais são reiniciados automaticamente no dia 1º de cada mês
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default SpendingLimitsView;
