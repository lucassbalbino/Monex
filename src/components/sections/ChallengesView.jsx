
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Calendar, Settings, Trash2, TrendingUp, Sparkles, RefreshCw, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useFinancialData } from '@/context/FinancialContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';

const ChallengesView = () => {
  const { toast } = useToast();
  const { 
    goals, 
    addGoal,
    modifyGoal,
    deleteGoal,
    resetToDefaultGoals 
  } = useFinancialData();
  
  const [editingGoal, setEditingGoal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [goalForm, setGoalForm] = useState({});

  // --- Goal Actions ---

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      description: goal.description || '',
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      months: goal.months,
    });
  };

  const handleCreateGoal = () => {
    setGoalForm({
      name: '',
      description: '',
      targetAmount: '',
      currentAmount: '',
      months: '12',
    });
    setIsCreating(true);
  };

  const handleSubmitGoal = () => {
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.months) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, valor alvo e prazo.",
        variant: "destructive"
      });
      return;
    }

    const goalData = {
      name: goalForm.name,
      description: goalForm.description,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: parseFloat(goalForm.currentAmount || 0),
      months: parseInt(goalForm.months),
      monthlyAmount: parseFloat(goalForm.targetAmount) / parseInt(goalForm.months),
      category: 'Personalizada',
      isFixed: false
    };

    if (isCreating) {
      addGoal(goalData);
      toast({ title: "Desafio criado!", description: "Nova meta adicionada com sucesso.", className: "bg-green-600 text-white" });
      setIsCreating(false);
    } else if (editingGoal) {
      modifyGoal(editingGoal.id, goalData);
      toast({ title: "Atualizado!", description: "Meta atualizada com sucesso.", className: "bg-blue-600 text-white" });
      setEditingGoal(null);
    }
  };

  const handleDeleteGoal = () => {
    if (!editingGoal) return;
    
    if (editingGoal.isFixed) {
      toast({
        title: "Ação Proibida",
        description: "Metas fixas não podem ser excluídas.",
        variant: "destructive"
      });
      return;
    }

    deleteGoal(editingGoal.id);
    setEditingGoal(null);
    toast({
      title: "Meta excluída.",
      variant: "destructive"
    });
  };

  const getGoalColor = (goal) => {
    if (goal.category === 'Segurança') return 'from-emerald-600 to-emerald-400';
    if (goal.category === 'Lazer') return 'from-orange-500 to-amber-400';
    if (goal.category === 'Investimento') return 'from-blue-600 to-cyan-400';
    if (goal.category === 'Dívidas') return 'from-red-600 to-pink-500';
    if (goal.category === 'Economia') return 'from-purple-600 to-indigo-400';
    return 'from-purple-600 to-purple-400';
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Desafios e Metas</h1>
          <p className="text-gray-400">Defina objetivos financeiros, acompanhe seu progresso e conquiste sonhos.</p>
        </div>
        
        <div className="flex gap-2">
           {goals.length === 0 && (
            <Button 
              onClick={resetToDefaultGoals}
              variant="outline"
              className="border-[#334155] text-gray-300 hover:text-white hover:bg-[#334155] gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Restaurar Padrão
            </Button>
          )}
          <Button 
            onClick={handleCreateGoal}
            className="bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2"
          >
            <Plus className="h-5 w-5" />
            Novo Desafio
          </Button>
        </div>
      </motion.div>

      {/* Goals Section */}
      <section>
        {goals.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1E293B] border border-[#334155] border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="inline-flex p-6 rounded-full bg-[#334155] mb-6">
              <Target className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-3">Nenhum desafio definido</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Crie seu primeiro desafio financeiro para começar a poupar.
            </p>
            <Button onClick={handleCreateGoal} className="bg-[#14B8A6] hover:bg-[#0D9488]">
              Criar Desafio Agora
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 flex flex-col justify-between hover:border-purple-500/50 transition-colors group relative shadow-lg"
              >
                 <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditGoal(goal)}
                      className="h-8 w-8 p-0 rounded-full bg-[#0F172A]/80 hover:bg-purple-900/50 text-gray-400 hover:text-white backdrop-blur-sm"
                      title="Modificar Meta"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                <div className="mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg border bg-opacity-10 border-opacity-20 ${
                        goal.category === 'Segurança' ? 'bg-emerald-500 border-emerald-500' :
                        goal.category === 'Dívidas' ? 'bg-red-500 border-red-500' :
                        'bg-purple-500 border-purple-500'
                      }`}
                    >
                      {goal.category === 'Segurança' ? <Target className="h-6 w-6 text-emerald-400" /> :
                       goal.category === 'Dívidas' ? <Target className="h-6 w-6 text-red-400" /> :
                       <TrendingUp className="h-6 w-6 text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-lg line-clamp-1" title={goal.name}>{goal.name}</h3>
                        {goal.isFixed ? (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 h-5 gap-1">
                             <Lock className="w-2 h-2" /> Fixa
                          </Badge>
                        ) : goal.isDefault && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] px-1.5 h-5 gap-1 border-blue-500/20">
                            <Sparkles className="w-2 h-2" /> Sugestão
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">{goal.description || 'Sem descrição definida.'}</p>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-4 pb-2 border-b border-[#334155]/50">
                    <span className="text-xs text-gray-400 uppercase font-medium">Progresso</span>
                    <span className="text-xs font-bold text-white">
                      {goal.targetAmount > 0 ? (((goal.currentAmount || 0) / goal.targetAmount) * 100).toFixed(0) : '0'}%
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">
                        {formatCurrency(goal.currentAmount || 0)}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Meta: {formatCurrency(goal.targetAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-3 w-full bg-[#0F172A] rounded-full overflow-hidden border border-[#334155]/50 p-0.5">
                    <div 
                      className={`h-full bg-gradient-to-r ${getGoalColor(goal)} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ width: `${Math.min((goal.targetAmount > 0 ? (goal.currentAmount || 0) / goal.targetAmount : 0) * 100, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 bg-[#0F172A] p-2 rounded-lg border border-[#334155]/30">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Prazo estimado
                    </span>
                    <span className="font-medium text-white">
                      {goal.months} meses
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Create/Modify Goal Dialog */}
      <Dialog open={!!editingGoal || isCreating} onOpenChange={(open) => {
        if (!open) {
          setEditingGoal(null);
          setIsCreating(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-[#1E293B] border-[#334155] text-white">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Criar Novo Desafio' : 'Modificar Meta'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isCreating ? 'Defina seu objetivo e quanto tempo você precisa.' : 'Personalize esta meta de acordo com sua realidade.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="goal-name" className="text-gray-300">Título</Label>
              <Input 
                id="goal-name" 
                placeholder="Ex: Viagem para Europa"
                value={goalForm.name || ''} 
                onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
                className="bg-[#0F172A] border-[#334155] text-white" 
                disabled={editingGoal?.isFixed} 
              />
              {editingGoal?.isFixed && <p className="text-[10px] text-amber-500">O nome desta meta fixa não pode ser alterado.</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="goal-desc" className="text-gray-300">Descrição</Label>
              <Textarea 
                id="goal-desc" 
                value={goalForm.description || ''} 
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                className="bg-[#0F172A] border-[#334155] text-white min-h-[80px]" 
                placeholder="Detalhes sobre sua meta..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-target" className="text-xs text-gray-400">Valor Alvo (R$)</Label>
                <Input 
                  id="goal-target" 
                  type="number"
                  value={goalForm.targetAmount || ''} 
                  onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})}
                  className="bg-[#0F172A] border-[#334155] text-white" 
                  min="0"
                  step="0.01"
                />
                {goalForm.targetAmount && <p className="text-xs text-[#8B5CF6] font-medium">{formatCurrency(goalForm.targetAmount)}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-current" className="text-xs text-gray-400">Valor Guardado (R$)</Label>
                <Input 
                  id="goal-current" 
                  type="number"
                  value={goalForm.currentAmount || ''} 
                  onChange={(e) => setGoalForm({...goalForm, currentAmount: e.target.value})}
                  className="bg-[#0F172A] border-[#334155] text-white" 
                  min="0"
                  step="0.01"
                />
                {goalForm.currentAmount && <p className="text-xs text-[#14B8A6] font-medium">{formatCurrency(goalForm.currentAmount)}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal-months" className="text-gray-300">Prazo (Meses)</Label>
              <Input 
                id="goal-months" 
                type="number"
                value={goalForm.months || ''} 
                onChange={(e) => setGoalForm({...goalForm, months: e.target.value})}
                className="bg-[#0F172A] border-[#334155] text-white" 
              />
              <p className="text-[10px] text-gray-400">
                Necessário: {formatCurrency(((parseFloat(goalForm.targetAmount || 0) - parseFloat(goalForm.currentAmount || 0)) / (parseInt(goalForm.months) || 1)))} / mês
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!isCreating && !editingGoal?.isFixed && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteGoal}
                className="sm:mr-auto bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => { setEditingGoal(null); setIsCreating(false); }} className="border-[#334155] text-gray-300 hover:bg-[#334155]">
              Cancelar
            </Button>
            <Button onClick={handleSubmitGoal} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isCreating ? 'Criar Desafio' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallengesView;
