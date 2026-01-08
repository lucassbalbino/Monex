
import React from 'react';
import { motion } from 'framer-motion';
import { Construction, BrainCircuit, Activity, Lock } from 'lucide-react';

const EmotionalProgressView = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto text-center space-y-8 p-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-[#1E293B] p-8 rounded-full border-2 border-[#334155] shadow-2xl">
          <BrainCircuit className="w-24 h-24 text-[#14B8A6]" />
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-[#1E293B] flex items-center gap-1">
            <Construction className="w-3 h-3" />
            EM DESENVOLVIMENTO
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4 max-w-2xl"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Análise Técnica de Perfil
          <span className="block text-lg font-normal text-[#14B8A6] mt-2">Próxima Geração de Insights</span>
        </h1>
        
        <div className="bg-[#1E293B]/50 p-6 rounded-xl border border-[#334155] text-gray-300 leading-relaxed text-lg">
          <p>
            Este menu apresentará uma análise técnica de cada perfil financeiro. 
            Você poderá alterar seu perfil através de análises técnicas baseadas em 
            seu comportamento financeiro e dados.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
      >
        <div className="bg-[#1E293B] p-4 rounded-lg border border-[#334155] opacity-60">
          <Activity className="w-6 h-6 text-blue-400 mb-2 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Comportamento</h3>
          <p className="text-xs text-gray-500 mt-1">Análise de padrões</p>
        </div>
        <div className="bg-[#1E293B] p-4 rounded-lg border border-[#334155] opacity-60">
          <BrainCircuit className="w-6 h-6 text-purple-400 mb-2 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Psicologia</h3>
          <p className="text-xs text-gray-500 mt-1">Perfil de risco e viés</p>
        </div>
        <div className="bg-[#1E293B] p-4 rounded-lg border border-[#334155] opacity-60">
          <Lock className="w-6 h-6 text-green-400 mb-2 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Segurança</h3>
          <p className="text-xs text-gray-500 mt-1">Dados criptografados</p>
        </div>
      </motion.div>
    </div>
  );
};

export default EmotionalProgressView;
