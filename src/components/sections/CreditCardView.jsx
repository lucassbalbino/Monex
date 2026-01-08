
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, UploadCloud, CreditCard as CardIcon, Calendar, DollarSign, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useFinancialData } from '@/context/FinancialContext';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BANKS = [
  { name: 'Nubank', color: 'bg-[#820AD1]', logo: 'NB' },
  { name: 'Inter', color: 'bg-[#FF7A00]', logo: 'IN' },
  { name: 'Itaú', color: 'bg-[#EC7000]', logo: 'IT' },
  { name: 'Bradesco', color: 'bg-[#CC092F]', logo: 'BR' },
  { name: 'Santander', color: 'bg-[#EC0000]', logo: 'SA' },
  { name: 'C6 Bank', color: 'bg-[#242424]', logo: 'C6' },
  { name: 'Outro', color: 'bg-slate-700', logo: 'CC' }
];

const CreditCardView = () => {
  const { creditCards, addCreditCard, deleteCreditCard, updateCreditCard, addInvoiceExpense } = useFinancialData();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [invoiceCard, setInvoiceCard] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    bank: 'Nubank',
    limit: '',
    dueDate: '',
    lastDigits: ''
  });

  const [invoiceAmount, setInvoiceAmount] = useState('');

  const handleSaveCard = () => {
    if (!formData.name || !formData.limit || !formData.dueDate) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const cardData = {
      name: formData.name,
      bank: formData.bank,
      limit: parseFloat(formData.limit),
      dueDate: formData.dueDate, // Day of month (1-31)
      lastDigits: formData.lastDigits || '****'
    };

    if (editingCard) {
      updateCreditCard(editingCard.id, cardData);
      toast({ title: "Sucesso", description: "Cartão atualizado!" });
    } else {
      addCreditCard(cardData);
      toast({ title: "Sucesso", description: "Novo cartão adicionado!" });
    }

    setEditingCard(null);
    setIsAddOpen(false);
    resetForm();
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      bank: card.bank,
      limit: card.limit,
      dueDate: card.dueDate,
      lastDigits: card.lastDigits
    });
    setIsAddOpen(true);
  };

  const handleDelete = (id) => {
    deleteCreditCard(id);
    toast({ title: "Removido", description: "Cartão excluído com sucesso." });
  };

  const handleImportInvoice = () => {
    if (!invoiceAmount || isNaN(invoiceAmount) || !invoiceCard) return;

    // Simulate file reading/processing delay
    toast({ title: "Processando...", description: "Lançando fatura como despesa..." });

    setTimeout(() => {
        addInvoiceExpense(invoiceCard.id, invoiceAmount, `Fatura ${invoiceCard.bank} - ${invoiceCard.name}`);
        setInvoiceAmount('');
        setInvoiceCard(null);
        toast({ 
            title: "Fatura Lançada!", 
            description: `Valor de ${formatCurrency(invoiceAmount)} adicionado às despesas.`,
            className: "bg-green-600 text-white"
        });
    }, 1000);
  };

  const resetForm = () => {
    setFormData({ name: '', bank: 'Nubank', limit: '', dueDate: '', lastDigits: '' });
  };

  const getBankStyle = (bankName) => {
    return BANKS.find(b => b.name === bankName) || BANKS[BANKS.length - 1];
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Cartões</h1>
          <p className="text-gray-400">Gerencie limites, vencimentos e lance suas faturas.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) { setEditingCard(null); resetForm(); }}}>
          <DialogTrigger asChild>
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2">
              <Plus className="h-5 w-5" /> Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Editar Cartão' : 'Adicionar Novo Cartão'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Apelido do Cartão</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Nubank Principal"
                  className="bg-[#0F172A] border-[#334155] text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Banco Emissor</Label>
                    <Select value={formData.bank} onValueChange={(val) => setFormData({...formData, bank: val})}>
                        <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                            {BANKS.map(b => (
                                <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Dia Vencimento</Label>
                    <Input 
                        type="number"
                        min="1" max="31"
                        value={formData.dueDate}
                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                        className="bg-[#0F172A] border-[#334155] text-white"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Limite Total (R$)</Label>
                    <Input 
                        type="number"
                        value={formData.limit}
                        onChange={e => setFormData({...formData, limit: e.target.value})}
                        className="bg-[#0F172A] border-[#334155] text-white"
                        placeholder="0.00"
                    />
                    {formData.limit && <p className="text-xs text-[#14B8A6]">{formatCurrency(formData.limit)}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Últimos 4 Dígitos</Label>
                    <Input 
                        maxLength={4}
                        value={formData.lastDigits}
                        onChange={e => setFormData({...formData, lastDigits: e.target.value})}
                        className="bg-[#0F172A] border-[#334155] text-white"
                        placeholder="1234"
                    />
                </div>
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)} className="border-[#334155] text-gray-400 hover:text-white">Cancelar</Button>
                <Button onClick={handleSaveCard} className="bg-[#14B8A6] hover:bg-[#0D9488] text-white">Salvar Cartão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B]/50 rounded-xl border border-dashed border-[#334155]">
            <CardIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300">Nenhum cartão cadastrado</h3>
            <p className="text-gray-500 mt-2">Adicione seus cartões para controlar faturas e limites.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
                {creditCards.map((card) => {
                    const bankStyle = getBankStyle(card.bank);
                    const available = card.limit - (card.currentBill || 0);
                    const usagePercent = card.limit > 0 ? (card.currentBill / card.limit) * 100 : 0;

                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="group relative"
                        >
                            {/* Realistic Card UI */}
                            <div className={`relative h-56 rounded-2xl p-6 text-white shadow-xl overflow-hidden transition-transform duration-300 hover:-translate-y-2 ${bankStyle.color}`}>
                                {/* Background Patterns */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>

                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-6 bg-yellow-400/80 rounded-sm flex overflow-hidden opacity-90">
                                                <div className="w-1/2 h-full border-r border-black/10"></div>
                                            </div>
                                            {/* Contactless Icon */}
                                            <svg className="w-6 h-6 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                                        </div>
                                        <span className="font-bold text-lg tracking-wider opacity-90">{card.bank}</span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-white/70 uppercase tracking-widest">Saldo Disponível</p>
                                        <p className="text-2xl font-mono font-bold tracking-tight">{formatCurrency(available)}</p>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-white/60 uppercase">Titular</p>
                                            <p className="font-medium tracking-wide uppercase text-sm truncate max-w-[150px]">{card.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-white/60 uppercase">Vencimento</p>
                                            <p className="font-medium">Dia {card.dueDate}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                             <p className="text-lg font-mono tracking-widest">•••• {card.lastDigits}</p>
                                             <div className="h-6 w-10 bg-white/20 rounded mt-1 flex items-center justify-center">
                                                 <div className="w-3 h-3 rounded-full bg-red-500/80 -mr-1"></div>
                                                 <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Actions Overlay (Visible on Hover/Click) */}
                            <div className="mt-4 space-y-3 bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                    <span>Limite Utilizado</span>
                                    <span className={`${usagePercent > 80 ? 'text-red-400' : 'text-white'}`}>{usagePercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                    <span>Fatura Atual: <strong className="text-white">{formatCurrency(card.currentBill)}</strong></span>
                                    <span>Total: {formatCurrency(card.limit)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                     <Dialog open={invoiceCard?.id === card.id} onOpenChange={(open) => !open && setInvoiceCard(null)}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                                                onClick={() => setInvoiceCard(card)}
                                            >
                                                <FileText className="w-3 h-3 mr-2" />
                                                Lançar Fatura
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                                            <DialogHeader>
                                                <DialogTitle>Lançar Fatura - {card.name}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155]">
                                                  <p className="text-sm text-gray-400 mb-2">Este processo irá:</p>
                                                  <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                                                    <li>Adicionar o valor total como uma <strong>Despesa</strong> no seu histórico.</li>
                                                    <li>Atualizar o uso do limite deste cartão.</li>
                                                  </ul>
                                                </div>
                                                <div>
                                                    <Label>Valor Total da Fatura (R$)</Label>
                                                    <Input 
                                                        type="number" 
                                                        value={invoiceAmount}
                                                        onChange={(e) => setInvoiceAmount(e.target.value)}
                                                        className="bg-[#0F172A] border-[#334155] text-white mt-1"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleImportInvoice} className="w-full bg-[#14B8A6] hover:bg-[#0D9488]">
                                                    Confirmar Lançamento
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                     </Dialog>
                                    
                                     <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="flex-1 hover:bg-[#334155]" onClick={() => handleEdit(card)}>
                                            <Edit2 className="w-4 h-4 text-blue-400" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="flex-1 hover:bg-[#334155]" onClick={() => handleDelete(card.id)}>
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CreditCardView;
