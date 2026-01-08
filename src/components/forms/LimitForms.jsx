
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancialData } from '@/context/FinancialContext';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// EXPANDED CATEGORY LIST
const CATEGORIES = [
  "Alimentação", 
  "Assinaturas e Serviços", 
  "Casa", 
  "Compras", 
  "Cuidados Pessoais", 
  "Dívidas",
  "Educação", 
  "Investimento", 
  "Lazer e Hobbies", 
  "Mercado", 
  "Moradia",
  "Outros", 
  "Presentes e Doações", 
  "Roupas", 
  "Saúde", 
  "Serviços",
  "Trabalho", 
  "Transporte", 
  "Viagem"
];

export const CreateLimitForm = ({ onSuccess }) => {
  const { addSpendingLimit } = useFinancialData();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('Mensal');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount || !period || !category) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    addSpendingLimit({
      name,
      limit: parseFloat(amount),
      period,
      category
    });

    toast({ title: "Limite de gastos criado com sucesso!", className: "bg-teal-600 text-white" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-200">Nome do Limite</Label>
        <Input 
          id="name" 
          placeholder="Ex: Mercado Mensal" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="bg-[#0F172A] border-[#334155] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-200">Categoria Associada</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E293B] border-[#334155] text-white max-h-[200px]">
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat} className="focus:bg-[#334155] focus:text-white cursor-pointer">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-gray-200">Valor do Limite (R$)</Label>
          <Input 
            id="amount" 
            type="number" 
            placeholder="0.00" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="bg-[#0F172A] border-[#334155] text-white"
            min="0"
            step="0.01"
          />
          {amount && <p className="text-xs text-[#14B8A6] font-medium">{formatCurrency(amount)}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-gray-200">Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
              <SelectItem value="Semanal">Semanal</SelectItem>
              <SelectItem value="Mensal">Mensal</SelectItem>
              <SelectItem value="Anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white mt-4">
        Criar Limite
      </Button>
    </form>
  );
};

export const EditLimitForm = ({ limitData, onSuccess }) => {
  const { updateSpendingLimit, deleteSpendingLimit } = useFinancialData();
  const { toast } = useToast();
  
  const [newLimit, setNewLimit] = useState(limitData.limit);

  const handleUpdate = () => {
    updateSpendingLimit(limitData.id, { limit: parseFloat(newLimit) });
    toast({ title: "Limite atualizado com sucesso!", className: "bg-blue-600 text-white" });
    onSuccess();
  };

  const handleDelete = () => {
    deleteSpendingLimit(limitData.id);
    toast({ title: "Limite removido.", variant: "destructive" });
    onSuccess();
  };

  const adjustLimit = (adjustment) => {
    setNewLimit(prev => Math.max(0, parseFloat(prev) + adjustment));
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="p-4 bg-[#0F172A] rounded-lg border border-[#334155]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Atual</span>
          <span className="text-white font-bold">{formatCurrency(limitData.limit)}</span>
        </div>
        <div className="h-2 w-full bg-[#334155] rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${Math.min((limitData.spent / limitData.limit) * 100, 100)}%` }} 
          />
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {limitData.limit > 0 ? ((limitData.spent / limitData.limit) * 100).toFixed(0) : '0'}% utilizado
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-amount" className="text-gray-200">Novo Valor do Limite</Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => adjustLimit(-50)}
            className="bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
          >
            <TrendingDown className="h-4 w-4" />
          </Button>
          <div className="relative flex-1">
             <Input 
              id="edit-amount" 
              type="number" 
              value={newLimit} 
              onChange={e => setNewLimit(e.target.value)} 
              className="bg-[#0F172A] border-[#334155] text-white text-center font-bold"
              step="0.01"
            />
             {newLimit && <p className="text-[10px] text-center text-[#14B8A6] mt-1">{formatCurrency(newLimit)}</p>}
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => adjustLimit(50)}
            className="bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          onClick={handleDelete}
          variant="destructive" 
          className="flex-1 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
        <Button 
          onClick={handleUpdate} 
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white"
        >
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};
