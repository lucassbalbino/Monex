
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  Lightbulb, 
  Wallet, 
  ArrowRight, 
  TrendingDown,
  PiggyBank,
  CreditCard,
  Calendar
} from 'lucide-react';
import { useFinancialData } from '@/context/FinancialContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';

const ConsciousSpendingView = () => {
  const { monthlyStats, goals, transactions, stats } = useFinancialData();
  
  // --- Calculator State ---
  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState(null);

  // --- Insights State ---
  const [insight, setInsight] = useState(null);

  // --- Logic: Dynamic Insights Generator ---
  useEffect(() => {
    generateDynamicInsight();
  }, [monthlyStats, goals, transactions]);

  const generateDynamicInsight = () => {
    // 1. Check for negative balance
    const available = monthlyStats.income - monthlyStats.expenses;
    if (available < 0) {
      setInsight({
        type: 'danger',
        title: 'Alerta de Déficit',
        text: 'Seus gastos superaram sua renda este mês. A prioridade absoluta agora é cortar despesas não essenciais.',
        action: 'Revise suas assinaturas e gastos variáveis.'
      });
      return;
    }

    // 2. Check for savings potential
    if (available > 500 && goals.some(g => g.currentAmount < g.targetAmount)) {
      setInsight({
        type: 'opportunity',
        title: 'Potencial de Aceleração',
        text: `Você tem ${formatCurrency(available)} disponíveis. Que tal alocar 50% disso para sua meta prioritária?`,
        action: 'Fazer uma transferência para metas.'
      });
      return;
    }

    // 3. Category Analysis (Simple Top Expense)
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
      }, {});
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      const yearlyProj = topCategory[1] * 12;
      setInsight({
        type: 'pattern',
        title: `Padrão de Gasto: ${topCategory[0]}`,
        text: `Seus gastos com ${topCategory[0]} somam ${formatCurrency(topCategory[1])} recentemente. Nesse ritmo, serão ${formatCurrency(yearlyProj)} em um ano.`,
        action: `Tente reduzir 15% em ${topCategory[0]} para economizar ${formatCurrency(yearlyProj * 0.15)}.`
      });
      return;
    }

    // 4. Default Insight
    setInsight({
      type: 'tip',
      title: 'Regra 50/30/20',
      text: 'Uma boa prática é dividir sua renda: 50% Essenciais, 30% Desejos Pessoais e 20% Investimentos/Dívidas.',
      action: 'Verifique se seu orçamento segue essa proporção.'
    });
  };

  // --- Logic: Purchase Calculator ---
  const handleCalculate = () => {
    if (!price || !item) return;

    const numericPrice = parseFloat(price);
    const availableBudget = monthlyStats.income - monthlyStats.expenses;
    const currentBalance = stats.balance; // Saldo total atual acumulado
    
    // Impact on top priority goal (first goal that isn't full)
    const targetGoal = goals.find(g => g.currentAmount < g.targetAmount) || goals[0];
    const goalImpactPercent = targetGoal ? (numericPrice / targetGoal.targetAmount) * 100 : 0;

    let verdict = 'caution';
    let verdictText = 'Pense bem antes de comprar.';
    let paymentAdvice = '';
    
    // Análise de Veredito
    if (availableBudget < numericPrice && currentBalance < numericPrice) {
      verdict = 'denied';
      verdictText = 'Sem orçamento livre nem saldo suficiente.';
    } else if (goalImpactPercent > 50 && availableBudget < numericPrice * 2) {
      verdict = 'caution';
      verdictText = 'Impacto alto na sua meta prioritária.';
    } else if (availableBudget > numericPrice * 1.5) {
      verdict = 'approved';
      verdictText = 'Compra segura, cabe no orçamento mensal!';
    }

    // Análise de Pagamento (Ponto Positivo/Dica)
    // Cenário 1: Saldo baixo, mas tem renda mensal sobrando -> Parcela no cartão
    if (currentBalance < numericPrice && availableBudget > (numericPrice / 3)) {
      paymentAdvice = 'Seu saldo atual é baixo, mas você tem fluxo mensal. Considere dividir no cartão sem juros para não zerar o caixa.';
    } 
    // Cenário 2: Tem saldo total, mas o fluxo mensal está apertado -> Paga à vista
    else if (currentBalance >= numericPrice && availableBudget < numericPrice) {
      paymentAdvice = 'Use seu saldo acumulado para pagar à vista e evite comprometer a renda futura com parcelas.';
    }
    // Cenário 3: Não tem saldo nem fluxo -> Espere
    else if (currentBalance < numericPrice && availableBudget < numericPrice) {
      paymentAdvice = 'O ideal é esperar o próximo mês e juntar o dinheiro vivo.';
    }
    // Cenário 4: Tem tudo sobrando
    else {
      paymentAdvice = 'Você pode pagar à vista e negociar um desconto de 5% ou 10%!';
    }

    // Check for insufficient data
    const hasInsufficientData = monthlyStats.income === 0 && stats.balance === 0;

    setResult({
      percentOfBudget: availableBudget > 0 ? ((numericPrice / availableBudget) * 100).toFixed(1) : '> 100',
      goalImpact: targetGoal ? `${goalImpactPercent.toFixed(1)}% da meta "${targetGoal.name}"` : 'N/A',
      verdict,
      verdictText,
      paymentAdvice,
      // 5 years (60 months) at 1.5% monthly compound interest
      investedValue: formatCurrency(numericPrice * Math.pow(1.015, 60)),
      insufficientData: hasInsufficientData
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Gastos Conscientes</h1>
        <p className="text-gray-400">Ferramentas para tomar decisões financeiras mais inteligentes.</p>
      </div>

      {/* Calculator Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Input Card */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] shadow-lg flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Calculadora da Verdade</h2>
              <p className="text-sm text-gray-400">Devo comprar isso agora?</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <Label className="text-gray-300">O que você quer comprar?</Label>
              <Input 
                placeholder="Ex: Tênis novo, Smartphone..." 
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="bg-[#0F172A] border-[#334155] text-white mt-1 h-12"
              />
            </div>
            <div>
              <Label className="text-gray-300">Quanto custa (R$)?</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-[#0F172A] border-[#334155] text-white mt-1 h-12"
                min="0"
                step="0.01"
              />
              {price && <p className="text-xs text-[#8B5CF6] font-medium mt-2">{formatCurrency(price)}</p>}
            </div>
            <Button 
              onClick={handleCalculate}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 text-lg shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02]"
            >
              Analisar Decisão <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Result Card */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-xl p-6 border-2 shadow-lg flex flex-col justify-between ${
                result.verdict === 'approved' ? 'bg-emerald-950/30 border-emerald-500/50' : 
                result.verdict === 'denied' ? 'bg-red-950/30 border-red-500/50' : 
                'bg-amber-950/30 border-amber-500/50'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-200">Veredito do Monex</h3>
                  {result.verdict === 'approved' && <ThumbsUp className="h-8 w-8 text-emerald-500" />}
                  {result.verdict === 'denied' && <ThumbsDown className="h-8 w-8 text-red-500" />}
                  {result.verdict === 'caution' && <AlertTriangle className="h-8 w-8 text-amber-500" />}
                </div>
                
                <p className={`text-2xl font-bold mb-6 ${
                  result.verdict === 'approved' ? 'text-emerald-400' : 
                  result.verdict === 'denied' ? 'text-red-400' : 
                  'text-amber-400'
                }`}>
                  {result.verdictText}
                </p>

                <div className="space-y-4">
                  {/* Warning for insufficient data */}
                  {result.insufficientData && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm flex gap-3 items-start">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                      <p>Atenção: Seus dados financeiros parecem incompletos (renda ou saldo zerados). Para uma análise mais precisa, certifique-se de registrar suas receitas e saldo atual no Dashboard.</p>
                    </div>
                  )}

                  {/* Payment Advice Section */}
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                     <div className="flex items-start gap-3">
                        {result.paymentAdvice.includes('cartão') ? 
                          <CreditCard className="h-5 w-5 text-blue-400 mt-1 shrink-0" /> : 
                          result.paymentAdvice.includes('esperar') ? 
                          <Calendar className="h-5 w-5 text-orange-400 mt-1 shrink-0" /> :
                          <Wallet className="h-5 w-5 text-green-400 mt-1 shrink-0" />
                        }
                        <div>
                          <p className="text-sm font-semibold text-gray-300 mb-1">Estratégia Recomendada:</p>
                          <p className="text-white text-sm leading-relaxed">{result.paymentAdvice}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Wallet className="h-4 w-4 text-green-400" />
                      <span>Consome <strong className="text-white">{result.percentOfBudget}%</strong> do orçamento mensal livre.</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <TrendingDown className="h-4 w-4 text-purple-400" />
                      <span>Se investido (1.5% a.m), viraria <strong className="text-white">{result.investedValue}</strong> em 5 anos.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-[#1E293B]/50 rounded-xl border border-[#334155] border-dashed flex items-center justify-center p-6"
            >
              <div className="text-center text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Preencha os dados ao lado para revelar a verdade sobre sua compra.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spending Insights Section (Bottom) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl p-8 border border-[#334155] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Lightbulb className="h-32 w-32 text-white" />
        </div>

        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          Insights Financeiros Dinâmicos
        </h3>

        {insight && (
          // Modified layout: Removed 2nd column (Action Box), expanded text area
          <div className="relative z-10">
            <div className="space-y-4 max-w-4xl">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                ${insight.type === 'danger' ? 'bg-red-500/20 text-red-400' : 
                  insight.type === 'opportunity' ? 'bg-emerald-500/20 text-emerald-400' : 
                  'bg-blue-500/20 text-blue-400'}`}>
                {insight.type === 'danger' ? <AlertTriangle className="h-3 w-3" /> : 
                 insight.type === 'opportunity' ? <PiggyBank className="h-3 w-3" /> : 
                 <Lightbulb className="h-3 w-3" />}
                {insight.title}
              </div>
              
              <p className="text-2xl text-gray-200 font-light leading-relaxed">
                "{insight.text}"
              </p>
            </div>
            
            {/* "Recommended Action" box removed per user request */}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Sparkles = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
  </svg>
);

export default ConsciousSpendingView;
