import React, { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '@/lib/customSupabaseClient';
import DashboardView from '@/components/sections/DashboardView';
import TrackingView from '@/components/sections/TrackingView';
import SpendingLimitsView from '@/components/sections/SpendingLimitsView';
import ConsciousSpendingView from '@/components/sections/ConsciousSpendingView';
import DecisionSupportView from '@/components/sections/DecisionSupportView';
import SummariesView from '@/components/sections/SummariesView';
import InvisibleMoneyView from '@/components/sections/InvisibleMoneyView';
import EmotionalProgressView from '@/components/sections/EmotionalProgressView';
import ProgressView from '@/components/sections/ProgressView';
import DebtTipsView from '@/components/sections/DebtTipsView';
import ChallengesView from '@/components/sections/ChallengesView';
import CreditCardView from '@/components/sections/CreditCardView';

const Dashboard = ({ activeSection }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading'); // loading, active, past_due, inactive
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setSubscriptionStatus(profile.subscription_status || 'inactive');
        } else {
          setSubscriptionStatus('inactive');
        }
      }
      setLoading(false);
    };

    checkSubscription();
  }, []);

  const handleUpdatePayment = () => {
    // Redirect to plans or customer portal (simplified to plans for now)
    window.location.href = '/planos'; 
  };

  if (loading) return <div className="p-8 text-white">Carregando informações...</div>;

  // Block access if inactive
  if (subscriptionStatus === 'inactive' || subscriptionStatus === 'canceled') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="bg-[#1E293B] p-8 rounded-2xl border border-[#334155] max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Assinatura Necessária</h2>
          <p className="text-gray-400 mb-6">
            Para acessar o Monex e transformar sua vida financeira, você precisa de uma assinatura ativa.
          </p>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold"
          >
            Assinar Agora
          </Button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardView />;
      case 'tracking': return <TrackingView />;
      case 'challenges': return <ChallengesView />;
      case 'spending-limits': return <SpendingLimitsView />;
      case 'credit-cards': return <CreditCardView />;
      case 'conscious-spending': return <ConsciousSpendingView />;
      case 'decision-support': return <DecisionSupportView />;
      case 'summaries': return <SummariesView />;
      case 'invisible-money': return <InvisibleMoneyView />;
      case 'emotional-progress': return <EmotionalProgressView />;
      case 'progress': return <ProgressView />;
      case 'debt-tips': return <DebtTipsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {subscriptionStatus === 'past_due' && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Sua cobrança foi mal sucedida. Atualize seus dados de pagamento para evitar bloqueio.</span>
            <Button variant="outline" size="sm" onClick={handleUpdatePayment} className="ml-4 border-red-800 hover:bg-red-900/50">
              Regularizar assinatura
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {renderSection()}
    </div>
  );
};

export default Dashboard;