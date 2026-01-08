import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import StatsCard from '@/components/StatsCard';
import QuickActions from '@/components/QuickActions';
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle, ExternalLink, XCircle } from 'lucide-react';
import { useFinancialData } from '@/context/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DashboardView = () => {
  const {
    stats: financialStats,
    monthlyStats,
    annualStats,
    userProfile
  } = useFinancialData();
  const { toast } = useToast();

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('dashboard_view_prefs');
      return saved ? JSON.parse(saved) : {
        balance: 'monthly',
        income: 'monthly',
        expenses: 'monthly'
      };
    } catch {
      return {
        balance: 'monthly',
        income: 'monthly',
        expenses: 'monthly'
      };
    }
  };
  const [viewModes, setViewModes] = useState(loadPreferences);

  useEffect(() => {
    localStorage.setItem('dashboard_view_prefs', JSON.stringify(viewModes));
  }, [viewModes]);
  const toggleMode = (key, mode) => {
    setViewModes(prev => ({
      ...prev,
      [key]: mode
    }));
  };

  const currentMonthName = new Date().toLocaleString('pt-BR', {
    month: 'long'
  });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
  const currentYear = new Date().getFullYear();
  
  const getCardData = (key, type, baseColor, Icon) => {
    const isMonthly = viewModes[key] === 'monthly';
    const data = isMonthly ? monthlyStats : annualStats;
    const value = data[type];
    const label = isMonthly ? capitalizedMonth : `${currentYear}`;

    const trend = type === 'expenses' ? 'down' : 'up';
    return {
      title: `${type === 'balance' ? 'Saldo' : type === 'income' ? 'Renda' : 'Despesas'} (${label})`,
      value: formatCurrency(value),
      change: isMonthly ? type === 'expenses' ? 'Saídas do mês' : 'Atualizado hoje' : 'Acumulado no ano',
      trend,
      icon: Icon,
      color: type === 'balance' ? value >= 0 ? '#14B8A6' : '#EF4444' : baseColor,
      enableToggle: true,
      viewMode: viewModes[key],
      onToggle: mode => toggleMode(key, mode)
    };
  };

  const stats = [
    getCardData('balance', 'balance', '#14B8A6', Wallet),
    getCardData('income', 'income', '#10B981', TrendingUp),
    getCardData('expenses', 'expenses', '#F59E0B', TrendingDown),
    {
      title: 'Meta de Economia',
      value: `${financialStats.savingsGoal || 0}%`,
      change: 'Em progresso',
      trend: 'up',
      icon: Target,
      color: '#8B5CF6',
      enableToggle: false
    }
  ];

  // Determine username to display
  const userName = userProfile?.full_name || userProfile?.name || 'Usuário';
  
  // Payment Failure Logic
  const hasPaymentFailed = userProfile?.subscription_status === 'payment_failed' || userProfile?.subscription_status === 'past_due';

  return (
    <div className="space-y-6">
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }}>
        <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo, {userName}!</h1>
        <p className="text-gray-400">
          Resumo financeiro • <span className="text-[#14B8A6] font-semibold">{capitalizedMonth} / {currentYear}</span>
        </p>
      </motion.div>

      {/* Payment Failure Banner */}
      {hasPaymentFailed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 shadow-lg shadow-red-500/10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-500/20 p-2 text-red-500">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-red-400">Sua cobrança foi mal-sucedida</h3>
                <p className="text-sm text-red-200/80">
                  Identificamos uma falha no processamento do seu último pagamento. 
                  Para evitar interrupções futuras no seu acesso, por favor verifique seu cartão.
                </p>
              </div>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white border-none shrink-0"
              onClick={() => window.open('https://billing.stripe.com/p/login/YOUR_PORTAL_ID', '_blank')}
            >
              Atualizar Pagamento
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      delay: 0.1
    }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => <StatsCard key={index} {...stat} index={index} />)}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }}>
          <QuickActions />
        </motion.div>

        <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }} className="lg:col-span-2">
          <ChatInterface />
        </motion.div>
      </div>
    </div>
  );
};
export default DashboardView;