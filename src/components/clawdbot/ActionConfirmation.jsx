import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useClawdBotContext } from '@/context/ClawdBotContext';

/**
 * Campos adicionais necessários para cada tipo de ação
 */
const ACTION_FIELDS = {
  adjustLimit: [
    { key: 'newLimit', label: 'Novo valor do limite (R$)', type: 'number', placeholder: '500.00' },
  ],
  createLimit: [
    { key: 'category', label: 'Categoria', type: 'text', placeholder: 'Ex: Alimentação' },
    { key: 'limit', label: 'Valor do limite (R$)', type: 'number', placeholder: '800.00' },
    { key: 'period', label: 'Período', type: 'select', options: ['Mensal', 'Semanal', 'Anual'] },
  ],
  createGoal: [
    { key: 'name', label: 'Nome da meta', type: 'text', placeholder: 'Ex: Viagem de férias' },
    { key: 'targetAmount', label: 'Valor alvo (R$)', type: 'number', placeholder: '5000.00' },
    { key: 'months', label: 'Prazo (meses)', type: 'number', placeholder: '12' },
  ],
  addToGoal: [
    { key: 'amount', label: 'Valor a adicionar (R$)', type: 'number', placeholder: '500.00' },
  ],
  payDebt: [
    { key: 'amount', label: 'Valor do pagamento (R$)', type: 'number', placeholder: '200.00' },
  ],
  addTransaction: [
    { key: 'type', label: 'Tipo', type: 'select', options: ['expense', 'income'] },
    { key: 'amount', label: 'Valor (R$)', type: 'number', placeholder: '100.00' },
    { key: 'description', label: 'Descrição', type: 'text', placeholder: 'Ex: Supermercado' },
    { key: 'category', label: 'Categoria', type: 'text', placeholder: 'Ex: Alimentação' },
  ],
};

const ActionConfirmation = () => {
  const { pendingAction, confirmAction, cancelAction, actionResult } = useClawdBotContext();
  const [formData, setFormData] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);

  // Reset formData quando uma nova ação pendente aparece
  useEffect(() => {
    if (pendingAction) {
      setFormData({});
    }
  }, [pendingAction]);

  if (!pendingAction && !actionResult) return null;

  // Mostra resultado da ação
  if (actionResult) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border ${
            actionResult.success 
              ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-200' 
              : 'bg-red-900/90 border-red-500/40 text-red-200'
          }`}>
            {actionResult.success 
              ? <CheckCircle className="h-5 w-5 text-emerald-400" /> 
              : <XCircle className="h-5 w-5 text-red-400" />
            }
            <span className="text-sm font-medium">{actionResult.message}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const fields = ACTION_FIELDS[pendingAction.type] || [];

  const handleConfirm = async () => {
    setIsExecuting(true);
    await confirmAction(formData);
    setIsExecuting(false);
    setFormData({});
  };

  const handleCancel = () => {
    setFormData({});
    cancelAction();
  };

  return (
    <Dialog open={!!pendingAction} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="bg-[#1E293B] border-[#14B8A6]/30 text-white sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-gradient-to-tr from-[#14B8A6] to-[#2DD4BF] p-2 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">Monex - Confirmar Ação</DialogTitle>
              <DialogDescription className="text-gray-400 text-xs mt-0.5">
                Revise os dados antes de confirmar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Context from insight */}
        <div className="bg-[#0F172A] rounded-lg p-3 border border-[#334155] mt-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{pendingAction.title}</p>
              <p className="text-xs text-gray-400 mt-1">{pendingAction.description}</p>
            </div>
          </div>
        </div>

        {/* Dynamic form fields */}
        {fields.length > 0 && (
          <div className="space-y-3 mt-3">
            {fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs text-gray-300">{field.label}</Label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.key] || (pendingAction.data?.[field.key] || '')}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="">Selecione...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key] || (pendingAction.data?.[field.key] || '')}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="bg-[#0F172A] border-[#334155] text-white"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 border-[#334155] text-gray-300 hover:bg-[#334155] hover:text-white"
            disabled={isExecuting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-[#14B8A6] hover:bg-[#0D9488] text-white"
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Executando...
              </>
            ) : (
              pendingAction.actionLabel || 'Confirmar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionConfirmation;
