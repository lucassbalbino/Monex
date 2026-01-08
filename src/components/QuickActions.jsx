
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, ArrowDownRight, Calendar, Target, Repeat, Layers,
  Utensils, Smartphone, Home, ShoppingBag, Sparkles, GraduationCap,
  TrendingUp, Gamepad2, ShoppingCart, MoreHorizontal, Gift, Shirt,
  HeartPulse, Briefcase, Car, Plane, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFinancialData } from "@/context/FinancialContext";
import { formatCurrency } from '@/lib/utils';

const QuickActions = () => {
  const { toast } = useToast();
  const { addTransactions, addGoal } = useFinancialData();
  
  // Dialog States
  const [openIncome, setOpenIncome] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [openGoal, setOpenGoal] = useState(false);
  
  // Income Form State
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeType, setIncomeType] = useState('single'); // single, recurring
  const [incomeOccurrences, setIncomeOccurrences] = useState('12');

  // Expense Form State
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseType, setExpenseType] = useState('single'); // single, recurring, installment
  const [expenseOccurrences, setExpenseOccurrences] = useState('2');

  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [goalTotal, setGoalTotal] = useState('');
  const [goalMonths, setGoalMonths] = useState('');

  const categoryOptions = [
    { id: "Alimentação", label: "Alimentação", icon: Utensils },
    { id: "Assinaturas e Serviços", label: "Assinaturas", icon: Smartphone },
    { id: "Casa", label: "Casa", icon: Home },
    { id: "Compras", label: "Compras", icon: ShoppingBag },
    { id: "Cuidados Pessoais", label: "Pessoal", icon: Sparkles },
    { id: "Educação", label: "Educação", icon: GraduationCap },
    { id: "Investimento", label: "Investimento", icon: TrendingUp },
    { id: "Lazer e Hobbies", label: "Lazer", icon: Gamepad2 },
    { id: "Mercado", label: "Mercado", icon: ShoppingCart },
    { id: "Outros", label: "Outros", icon: MoreHorizontal },
    { id: "Presentes e Doações", label: "Presentes", icon: Gift },
    { id: "Roupas", label: "Roupas", icon: Shirt },
    { id: "Saúde", label: "Saúde", icon: HeartPulse },
    { id: "Trabalho", label: "Trabalho", icon: Briefcase },
    { id: "Transporte", label: "Transporte", icon: Car },
    { id: "Viagem", label: "Viagem", icon: Plane }
  ];

  const actions = [
    { icon: ArrowUpRight, label: 'Registrar Receita', color: 'bg-[#10B981]' },
    { icon: ArrowDownRight, label: 'Registrar Despesa', color: 'bg-[#F59E0B]' },
    { icon: Target, label: 'Definir Meta', color: 'bg-[#8B5CF6]' }
  ];

  const addMonthsToDate = (dateStr, monthsToAdd) => {
    const date = new Date(dateStr);
    date.setUTCHours(12);
    date.setUTCMonth(date.getUTCMonth() + monthsToAdd);
    return date.toISOString().split('T')[0];
  };

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (!incomeAmount || !incomeDate || !incomeDescription) {
      toast({ title: "Por favor, preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const transactionsToAdd = [];
    const occurrences = incomeType === 'single' ? 1 : parseInt(incomeOccurrences);

    if (isNaN(occurrences) || occurrences < 1) {
      toast({ title: "Número de ocorrências inválido", variant: "destructive" });
      return;
    }

    for (let i = 0; i < occurrences; i++) {
      transactionsToAdd.push({
        type: 'income',
        amount: incomeAmount,
        date: addMonthsToDate(incomeDate, i),
        description: incomeType === 'single' ? incomeDescription : `${incomeDescription} (${i + 1}/${occurrences})`,
        category: 'Receita'
      });
    }

    addTransactions(transactionsToAdd);
    toast({ title: incomeType === 'single' ? "Receita registrada!" : `Receita recorrente (${occurrences} meses) criada!`, className: "bg-green-600 text-white" });
    setOpenIncome(false);
    resetIncomeForm();
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDate || !expenseCategory || !expenseName) {
      toast({ title: "Por favor, preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const transactionsToAdd = [];
    let count = 1;
    let finalAmount = parseFloat(expenseAmount);
    let descriptionSuffix = '';

    if (expenseType === 'recurring') {
      count = parseInt(expenseOccurrences);
      descriptionSuffix = (i) => `(${i + 1}/${count})`;
    } else if (expenseType === 'installment') {
      count = parseInt(expenseOccurrences);
      finalAmount = parseFloat(expenseAmount) / count;
      descriptionSuffix = (i) => `(Parcela ${i + 1}/${count})`;
    }

    if (isNaN(count) || count < 1) {
      toast({ title: "Número de ocorrências/parcelas inválido", variant: "destructive" });
      return;
    }

    for (let i = 0; i < count; i++) {
      transactionsToAdd.push({
        type: 'expense',
        amount: finalAmount.toFixed(2),
        date: addMonthsToDate(expenseDate, i),
        description: expenseType === 'single' ? expenseName : `${expenseName} ${descriptionSuffix(i)}`,
        category: expenseCategory
      });
    }

    addTransactions(transactionsToAdd);
    toast({ title: expenseType === 'single' ? "Despesa registrada!" : "Transações futuras geradas com sucesso!", className: "bg-amber-600 text-white" });
    setOpenExpense(false);
    resetExpenseForm();
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!goalName || !goalTotal || !goalMonths) {
      toast({ title: "Por favor, preencha todos os campos", variant: "destructive" });
      return;
    }

    const monthlyAmount = (parseFloat(goalTotal) / parseInt(goalMonths)).toFixed(2);
    
    addGoal({
      name: goalName,
      targetAmount: parseFloat(goalTotal),
      months: parseInt(goalMonths),
      monthlyAmount: parseFloat(monthlyAmount)
    });

    toast({ title: "Meta definida com sucesso!", className: "bg-purple-600 text-white" });
    setOpenGoal(false);
    resetGoalForm();
  };

  const resetIncomeForm = () => {
    setIncomeAmount(''); 
    setIncomeDate('');
    setIncomeDescription('');
    setIncomeType('single');
    setIncomeOccurrences('12');
  };

  const resetExpenseForm = () => {
    setExpenseAmount('');
    setExpenseName('');
    setExpenseDate('');
    setExpenseCategory('');
    setExpenseType('single');
    setExpenseOccurrences('2');
  };

  const resetGoalForm = () => {
    setGoalName('');
    setGoalTotal('');
    setGoalMonths('');
  };

  const goalMonthlyAmount = (parseFloat(goalTotal) && parseInt(goalMonths)) 
    ? (parseFloat(goalTotal) / parseInt(goalMonths))
    : 0;

  const installmentValue = (expenseAmount && expenseOccurrences > 0)
    ? (parseFloat(expenseAmount)/parseInt(expenseOccurrences))
    : 0;

  return (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6">
      <h2 className="text-xl font-bold text-white mb-6">Ações Rápidas</h2>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          if (action.label === 'Registrar Receita') {
            return (
              <Dialog key={index} open={openIncome} onOpenChange={(open) => { setOpenIncome(open); if(!open) resetIncomeForm(); }}>
                <DialogTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Button
                      className={`w-full ${action.color} hover:opacity-90 text-white justify-start gap-3 py-6 transition-all duration-200`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                  <DialogHeader>
                    <DialogTitle>Registrar Nova Receita</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleIncomeSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="incomeAmount" className="text-gray-200">Valor da Receita</Label>
                      <Input
                        id="incomeAmount"
                        type="number"
                        placeholder="0.00"
                        value={incomeAmount}
                        onChange={(e) => setIncomeAmount(e.target.value)}
                        className="bg-[#0F172A] border-[#334155] text-white"
                        min="0"
                        step="0.01"
                      />
                      {incomeAmount && <p className="text-xs text-[#10B981] font-medium">{formatCurrency(incomeAmount)}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incomeDate" className="text-gray-200">Data do Recebimento</Label>
                      <Input
                        id="incomeDate"
                        type="date"
                        value={incomeDate}
                        onChange={(e) => setIncomeDate(e.target.value)}
                        className="bg-[#0F172A] border-[#334155] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incomeDescription" className="text-gray-200">Descrição</Label>
                      <Input
                        id="incomeDescription"
                        placeholder="Ex: Salário"
                        value={incomeDescription}
                        onChange={(e) => setIncomeDescription(e.target.value)}
                        className="bg-[#0F172A] border-[#334155] text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#334155]">
                       <div className="space-y-2">
                        <Label className="text-gray-200">Frequência</Label>
                        <Select value={incomeType} onValueChange={setIncomeType}>
                          <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                            <SelectItem value="single">Única</SelectItem>
                            <SelectItem value="recurring">Recorrente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {incomeType === 'recurring' && (
                        <div className="space-y-2">
                          <Label htmlFor="incomeOccurrences" className="text-gray-200">Nº de Meses</Label>
                          <div className="relative">
                            <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <Input
                              id="incomeOccurrences"
                              type="number"
                              value={incomeOccurrences}
                              onChange={(e) => setIncomeOccurrences(e.target.value)}
                              className="bg-[#0F172A] border-[#334155] text-white pl-9"
                              min="2"
                              max="120"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="mt-6">
                      <Button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-white w-full">
                        {incomeType === 'single' ? 'Confirmar Receita' : 'Gerar Receitas Recorrentes'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            );
          }

          if (action.label === 'Registrar Despesa') {
            return (
              <Dialog key={index} open={openExpense} onOpenChange={(open) => { setOpenExpense(open); if(!open) resetExpenseForm(); }}>
                <DialogTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Button
                      className={`w-full ${action.color} hover:opacity-90 text-white justify-start gap-3 py-6 transition-all duration-200`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="bg-[#1E293B] border-[#334155] text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Nova Despesa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expenseAmount" className="text-gray-200">
                          {expenseType === 'installment' ? 'Valor TOTAL' : 'Valor'}
                        </Label>
                        <Input
                          id="expenseAmount"
                          type="number"
                          placeholder="0.00"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="bg-[#0F172A] border-[#334155] text-white"
                          min="0"
                          step="0.01"
                        />
                        {expenseAmount && <p className="text-xs text-[#F59E0B] font-medium">{formatCurrency(expenseAmount)}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseDate" className="text-gray-200">
                          {expenseType === 'installment' ? 'Data 1ª Parcela' : 'Data'}
                        </Label>
                        <Input
                          id="expenseDate"
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="bg-[#0F172A] border-[#334155] text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expenseName" className="text-gray-200">Nome da Despesa</Label>
                      <Input
                        id="expenseName"
                        type="text"
                        placeholder="Ex: Almoço no Restaurante"
                        value={expenseName}
                        onChange={(e) => setExpenseName(e.target.value)}
                        className="bg-[#0F172A] border-[#334155] text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Categoria</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {categoryOptions.map((cat) => {
                          const Icon = cat.icon;
                          const isSelected = expenseCategory === cat.id;
                          return (
                            <div
                              key={cat.id}
                              onClick={() => setExpenseCategory(cat.id)}
                              className={`
                                cursor-pointer rounded-md border p-2 flex items-center gap-2 transition-all
                                ${isSelected 
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                                  : 'bg-[#0F172A] border-[#334155] text-gray-400 hover:border-gray-500 hover:bg-[#1E293B]'}
                              `}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="text-xs font-medium truncate">{cat.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#334155]">
                      <div className="space-y-2">
                        <Label className="text-gray-200">Tipo de Despesa</Label>
                        <Select value={expenseType} onValueChange={setExpenseType}>
                          <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                            <SelectItem value="single">Única</SelectItem>
                            <SelectItem value="recurring">Recorrente (Assinatura)</SelectItem>
                            <SelectItem value="installment">Parcelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {expenseType !== 'single' && (
                        <div className="space-y-2">
                          <Label htmlFor="expenseOccurrences" className="text-gray-200">
                            {expenseType === 'installment' ? 'Nº de Parcelas' : 'Nº de Meses'}
                          </Label>
                          <div className="relative">
                            {expenseType === 'installment' ? (
                              <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            ) : (
                              <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            )}
                            <Input
                              id="expenseOccurrences"
                              type="number"
                              value={expenseOccurrences}
                              onChange={(e) => setExpenseOccurrences(e.target.value)}
                              className="bg-[#0F172A] border-[#334155] text-white pl-9"
                              min="2"
                              max="120"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {expenseType === 'installment' && expenseAmount && expenseOccurrences > 0 && (
                      <div className="p-3 bg-blue-900/20 border border-blue-900/30 rounded text-sm text-blue-200">
                        Serão geradas <strong>{expenseOccurrences}</strong> parcelas de <strong>{formatCurrency(installmentValue)}</strong>
                      </div>
                    )}

                    <DialogFooter className="mt-6">
                      <Button type="submit" className="bg-[#F59E0B] hover:bg-[#D97706] text-white w-full">
                        {expenseType === 'single' ? 'Confirmar Despesa' : 'Gerar Transações'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            );
          }

          if (action.label === 'Definir Meta') {
            return (
              <Dialog key={index} open={openGoal} onOpenChange={(open) => { setOpenGoal(open); if(!open) resetGoalForm(); }}>
                <DialogTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Button
                      className={`w-full ${action.color} hover:opacity-90 text-white justify-start gap-3 py-6 transition-all duration-200`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                  <DialogHeader>
                    <DialogTitle>Definir Nova Meta Financeira</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGoalSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="goalName" className="text-gray-200">Nome da Meta</Label>
                      <Input
                        id="goalName"
                        placeholder="Ex: Viagem de Férias, Carro Novo"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        className="bg-[#0F172A] border-[#334155] text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="goalTotal" className="text-gray-200">Valor Total (R$)</Label>
                        <Input
                          id="goalTotal"
                          type="number"
                          placeholder="0.00"
                          value={goalTotal}
                          onChange={(e) => setGoalTotal(e.target.value)}
                          className="bg-[#0F172A] border-[#334155] text-white"
                          min="0"
                          step="0.01"
                        />
                        {goalTotal && <p className="text-xs text-[#8B5CF6] font-medium">{formatCurrency(goalTotal)}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goalMonths" className="text-gray-200">Tempo (Meses)</Label>
                        <Input
                          id="goalMonths"
                          type="number"
                          placeholder="12"
                          value={goalMonths}
                          onChange={(e) => setGoalMonths(e.target.value)}
                          className="bg-[#0F172A] border-[#334155] text-white"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155] flex items-center gap-4 mt-2">
                      <div className="bg-[#8B5CF6]/20 p-2 rounded-full">
                        <Calculator className="h-5 w-5 text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Valor Mensal Necessário</p>
                        <p className="text-lg font-bold text-[#8B5CF6]">{formatCurrency(goalMonthlyAmount)}</p>
                      </div>
                    </div>

                    <DialogFooter className="mt-6">
                      <Button type="submit" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white w-full">
                        Salvar Meta
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            );
          }

          return null; 
        })}
      </div>
    </div>
  );
};

export default QuickActions;
