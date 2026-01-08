
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DecisionSupportView = () => {
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState(null);

  const scenarios = [
    {
      id: 1,
      title: 'Comprar Carro Novo vs. Manter Atual',
      description: 'Compare o impacto financeiro de comprar um carro novo versus manter seu veículo atual',
      options: [
        { name: 'Comprar Carro Novo', cost: 25000, monthlyCost: 450, impact: 'Alto custo inicial, menor manutenção' },
        { name: 'Manter Atual', cost: 0, monthlyCost: 200, impact: 'Sem custo inicial, maior manutenção' }
      ]
    },
    {
      id: 2,
      title: 'Investir vs. Fundo de Emergência',
      description: 'Decida se deve investir o dinheiro extra ou construir sua reserva de emergência',
      options: [
        { name: 'Investir em Fundos', cost: 5000, monthlyCost: 0, impact: 'Potencial de 7-10% retorno anual, risco de mercado' },
        { name: 'Fundo de Emergência', cost: 5000, monthlyCost: 0, impact: 'Baixo retorno (~2%), alta segurança' }
      ]
    },
    {
      id: 3,
      title: 'Pagar Dívida vs. Investir',
      description: 'Compare pagar dívidas de juros altos versus investir',
      options: [
        { name: 'Pagar Cartão de Crédito', cost: 3000, monthlyCost: 0, impact: 'Economize 18% de juros ao ano, melhore o score' },
        { name: 'Investir', cost: 3000, monthlyCost: 0, impact: 'Potencial de 8% de retorno, dívida permanece' }
      ]
    }
  ];

  const handleRunScenario = (scenarioId) => {
    setSelectedScenario(scenarioId);
    toast({
      title: "🚧 Este recurso ainda não foi implementado — mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Apoio à Decisão</h1>
        <p className="text-gray-400">Analise cenários hipotéticos para tomar decisões financeiras informadas</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 hover:border-[#14B8A6] transition-all duration-300"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-[#14B8A6]/20 rounded-lg p-2">
                <HelpCircle className="h-5 w-5 text-[#14B8A6]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{scenario.title}</h3>
                <p className="text-sm text-gray-400">{scenario.description}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {scenario.options.map((option, optionIndex) => (
                <div key={optionIndex} className="bg-[#334155] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-white">{option.name}</span>
                    <span className="text-[#14B8A6] font-bold">
                      {option.cost > 0 ? `R$ ${option.cost.toLocaleString()}` : 'Sem custo'}
                    </span>
                  </div>
                  {option.monthlyCost > 0 && (
                    <p className="text-xs text-gray-400 mb-1">Mensal: R$ {option.monthlyCost}</p>
                  )}
                  <p className="text-xs text-gray-300">{option.impact}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleRunScenario(scenario.id)}
              className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white gap-2"
            >
              <Calculator className="h-4 w-4" />
              Executar Análise
            </Button>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-purple-500/20 to-[#14B8A6]/20 rounded-xl border border-purple-500/30 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3">Como Funciona o Apoio à Decisão</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1E293B] rounded-lg p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="text-white font-medium mb-1">Opções de Entrada</h4>
            <p className="text-sm text-gray-400">Insira seus cenários e opções financeiras</p>
          </div>
          <div className="bg-[#1E293B] rounded-lg p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="text-white font-medium mb-1">Análise de IA</h4>
            <p className="text-sm text-gray-400">Nossa IA analisa impactos de longo prazo e riscos</p>
          </div>
          <div className="bg-[#1E293B] rounded-lg p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="text-white font-medium mb-1">Obter Insights</h4>
            <p className="text-sm text-gray-400">Receba recomendações personalizadas</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DecisionSupportView;
