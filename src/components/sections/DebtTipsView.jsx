
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Banknote,
  Calendar,
  Zap,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFinancialData } from '@/context/FinancialContext';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

const DebtTipsView = () => {
  const { monthlyStats, debts, addDebt, deleteDebt, updateDebt, payDebt } = useFinancialData();
  const { toast } = useToast();
  
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(null); // ID of debt being paid

  // Form States
  const [newDebt, setNewDebt] = useState({
    name: '',
    totalValue: '',
    highPriority: false,
    deadline: '',
    installmentValue: '',
    interestRate: ''
  });
  
  const [paymentAmount, setPaymentAmount] = useState('');

  // --- Helpers ---
  const calculatePlans = (debt) => {
    const balance = debt.totalValue - debt.paidValue;
    if (balance <= 0) return null;

    // A: Conservative (Current Installment)
    const monthsA = debt.installmentValue > 0 ? Math.ceil(balance / debt.installmentValue) : 999;
    
    // B: Conscious (10% of Income or balance if small)
    const income = monthlyStats.income || 3000; // Fallback if income is 0
    const paymentB = Math.min(income * 0.10, balance);
    const monthsB = Math.ceil(balance / paymentB);

    // C: Aggressive (Prioritize High Interest - e.g., 20% of income + current installment)
    const paymentC = (income * 0.20) + Number(debt.installmentValue);
    const monthsC = Math.ceil(balance / paymentC);

    return {
      conservative: {
        payment: Number(debt.installmentValue),
        months: monthsA,
        label: 'Plano Conservador',
        desc: 'Mantém parcelas atuais. Sem esforço extra, mas demora mais.',
        icon: Leaf,
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/30'
      },
      conscious: {
        payment: paymentB,
        months: monthsB,
        label: 'Plano Consciente',
        desc: 'Usa 10% da sua renda. Reduz tempo e juros com equilíbrio.',
        icon: ShieldCheck,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30'
      },
      aggressive: {
        payment: paymentC,
        months: monthsC,
        label: 'Plano Agressivo',
        desc: 'Foco total na eliminação. Sacrifício temporário para liberdade rápida.',
        icon: Zap,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/30'
      }
    };
  };

  // --- Handlers ---

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.totalValue) {
      toast({ title: "Erro", description: "Nome e Valor Total são obrigatórios.", variant: "destructive" });
      return;
    }

    addDebt({
      name: newDebt.name,
      totalValue: parseFloat(newDebt.totalValue),
      highPriority: newDebt.highPriority,
      deadline: newDebt.deadline || null,
      installmentValue: parseFloat(newDebt.installmentValue) || 0,
      interestRate: parseFloat(newDebt.interestRate) || 0,
      selectedPlan: 'conservative' // Default
    });

    setNewDebt({ name: '', totalValue: '', highPriority: false, deadline: '', installmentValue: '', interestRate: '' });
    setIsAddingDebt(false);
    toast({ title: "Sucesso!", description: "Nova dívida adicionada." });
  };

  const handleDeleteDebt = (id) => {
    deleteDebt(id);
    toast({ title: "Removido", description: "Dívida removida com sucesso." });
  };

  const handleAddPayment = () => {
    if (!paymentAmount || isNaN(paymentAmount)) return;
    
    payDebt(isAddingPayment, paymentAmount);
    
    setPaymentAmount('');
    setIsAddingPayment(null);
    toast({ title: "Pagamento Registrado", description: "Seu progresso foi atualizado e a despesa registrada!" });
  };

  const handlePlanChange = (debtId, planType) => {
    updateDebt(debtId, { selectedPlan: planType });
    toast({ title: "Plano Atualizado", description: `Estratégia alterada para esta dívida.` });
  };

  // Sort debts: High Priority first
  const sortedDebts = [...debts].sort((a, b) => (b.highPriority === a.highPriority) ? 0 : b.highPriority ? 1 : -1);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Dívidas</h1>
          <p className="text-gray-400">Organize seus pagamentos e conquiste sua liberdade financeira.</p>
        </div>
        <Dialog open={isAddingDebt} onOpenChange={setIsAddingDebt}>
          <DialogTrigger asChild>
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white">
              <Plus className="mr-2 h-4 w-4" /> Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle>Adicionar Dívida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome da Dívida</Label>
                <Input 
                  value={newDebt.name} 
                  onChange={e => setNewDebt({...newDebt, name: e.target.value})}
                  placeholder="Ex: Cartão Visa, Financiamento Carro..." 
                  className="bg-[#0F172A] border-[#334155] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Total (R$)</Label>
                  <Input 
                    type="number"
                    value={newDebt.totalValue} 
                    onChange={e => setNewDebt({...newDebt, totalValue: e.target.value})}
                    placeholder="0.00" 
                    className="bg-[#0F172A] border-[#334155] text-white"
                    min="0"
                    step="0.01"
                  />
                  {newDebt.totalValue && <p className="text-xs text-[#14B8A6] font-medium mt-1">{formatCurrency(newDebt.totalValue)}</p>}
                </div>
                <div>
                  <Label>Parcela Atual (R$)</Label>
                  <Input 
                    type="number"
                    value={newDebt.installmentValue} 
                    onChange={e => setNewDebt({...newDebt, installmentValue: e.target.value})}
                    placeholder="0.00" 
                    className="bg-[#0F172A] border-[#334155] text-white"
                    min="0"
                    step="0.01"
                  />
                  {newDebt.installmentValue && <p className="text-xs text-[#14B8A6] font-medium mt-1">{formatCurrency(newDebt.installmentValue)}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Taxa de Juros (% a.m)</Label>
                  <Input 
                    type="number"
                    value={newDebt.interestRate} 
                    onChange={e => setNewDebt({...newDebt, interestRate: e.target.value})}
                    placeholder="0.00" 
                    className="bg-[#0F172A] border-[#334155] text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Prazo Final</Label>
                  <Input 
                    type="date"
                    value={newDebt.deadline} 
                    onChange={e => setNewDebt({...newDebt, deadline: e.target.value})}
                    className="bg-[#0F172A] border-[#334155] text-white"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="priority" 
                  checked={newDebt.highPriority}
                  onCheckedChange={(checked) => setNewDebt({...newDebt, highPriority: checked})}
                  className="border-gray-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <label
                  htmlFor="priority"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                >
                  Alta Prioridade / Juros Abusivos
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingDebt(false)} className="border-[#334155] text-gray-400 hover:text-white hover:bg-[#334155]">Cancelar</Button>
              <Button onClick={handleAddDebt} className="bg-[#14B8A6] hover:bg-[#0D9488] text-white">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Debts List */}
      <div className="grid grid-cols-1 gap-6">
        {sortedDebts.length === 0 ? (
          <div className="text-center py-20 bg-[#1E293B]/50 rounded-xl border border-dashed border-[#334155]">
            <CheckCircle2 className="h-16 w-16 text-emerald-500/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300">Você está livre de dívidas!</h3>
            <p className="text-gray-500 mt-2">Ou ainda não cadastrou nenhuma. Use o botão acima para começar.</p>
          </div>
        ) : (
          sortedDebts.map((debt) => {
            const plans = calculatePlans(debt);
            const activePlan = plans ? plans[debt.selectedPlan || 'conservative'] : null;
            const progress = (debt.paidValue / debt.totalValue) * 100;
            const remaining = debt.totalValue - debt.paidValue;

            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#1E293B] rounded-xl border ${debt.highPriority ? 'border-red-500/40 shadow-red-900/10' : 'border-[#334155]'} shadow-lg overflow-hidden`}
              >
                {/* Header Section */}
                <div className="p-6 border-b border-[#334155] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${debt.highPriority ? 'bg-red-500/20' : 'bg-[#334155]'}`}>
                      {debt.highPriority ? <AlertTriangle className="h-6 w-6 text-red-500" /> : <Banknote className="h-6 w-6 text-gray-400" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {debt.name}
                        {debt.deadline && (
                          <span className="text-xs font-normal text-gray-400 flex items-center gap-1 bg-[#0F172A] px-2 py-1 rounded-full border border-[#334155]">
                            <Calendar className="h-3 w-3" /> {new Date(debt.deadline).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span>Total: {formatCurrency(debt.totalValue)}</span>
                        {debt.interestRate > 0 && <span className="text-red-400">Juros: {debt.interestRate}% a.m</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Dialog open={isAddingPayment === debt.id} onOpenChange={(open) => !open && setIsAddingPayment(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => setIsAddingPayment(debt.id)}
                          variant="outline" 
                          className="flex-1 md:flex-none border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Pagar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                        <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
                        <div className="py-4">
                          <Label>Valor Pago (R$)</Label>
                          <Input 
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="bg-[#0F172A] border-[#334155] text-white mt-2"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          {paymentAmount && <p className="text-xs text-[#14B8A6] font-medium mt-1">{formatCurrency(paymentAmount)}</p>}
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddPayment} className="bg-[#14B8A6] hover:bg-[#0D9488] text-white w-full">Confirmar Pagamento</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteDebt(debt.id)}
                      className="text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Body Section */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Progress & Status */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progresso</span>
                      <span className="text-white font-bold">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-[#0F172A] rounded-full overflow-hidden border border-[#334155]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      />
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Restante</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(remaining)}</p>
                      </div>
                      {activePlan && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase font-bold">Estimativa</p>
                          <p className="text-sm font-medium text-white flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3 text-gray-400" /> ~{activePlan.months} meses
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Selector */}
                  <div className="lg:col-span-2">
                     <p className="text-xs text-gray-500 uppercase font-bold mb-3">Estratégia de Pagamento</p>
                     {plans ? (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         {Object.entries(plans).map(([key, plan]) => {
                           const Icon = plan.icon;
                           const isSelected = (debt.selectedPlan || 'conservative') === key;
                           return (
                             <button
                               key={key}
                               onClick={() => handlePlanChange(debt.id, key)}
                               className={`relative text-left p-3 rounded-lg border transition-all duration-200 ${
                                 isSelected 
                                   ? `${plan.bg} ring-1 ring-offset-0 ring-offset-transparent ring-${plan.color.split('-')[1]}-500`
                                   : 'bg-[#0F172A] border-[#334155] hover:border-gray-500 opacity-70 hover:opacity-100'
                               }`}
                             >
                               {isSelected && (
                                 <div className="absolute top-2 right-2">
                                   <CheckCircle2 className={`h-4 w-4 ${plan.color}`} />
                                 </div>
                               )}
                               <div className="flex items-center gap-2 mb-2">
                                 <Icon className={`h-4 w-4 ${plan.color}`} />
                                 <span className={`text-xs font-bold ${plan.color}`}>{plan.label}</span>
                               </div>
                               <p className="text-lg font-bold text-white mb-1">{formatCurrency(plan.payment)}<span className="text-xs font-normal text-gray-500">/mês</span></p>
                               <p className="text-[10px] text-gray-400 leading-tight">{plan.desc}</p>
                             </button>
                           );
                         })}
                       </div>
                     ) : (
                       <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                         <p className="text-emerald-400 text-sm font-medium">Parabéns! Esta dívida está quitada.</p>
                       </div>
                     )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DebtTipsView;
