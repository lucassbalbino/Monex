import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import DashboardView from '@/components/sections/DashboardView';
import TrackingView from '@/components/sections/TrackingView';
import SpendingLimitsView from '@/components/sections/SpendingLimitsView';
import ConsciousSpendingView from '@/components/sections/ConsciousSpendingView';
import SummariesView from '@/components/sections/SummariesView';
import EmotionalProgressView from '@/components/sections/EmotionalProgressView';
import ProgressView from '@/components/sections/ProgressView';
import DebtTipsView from '@/components/sections/DebtTipsView';
import ChallengesView from '@/components/sections/ChallengesView';
import CreditCardView from '@/components/sections/CreditCardView';

const Dashboard = ({ activeSection }) => {
  const { subscriptionStatus } = useAuth();

  const handleUpdatePayment = () => {
    window.location.href = '/planos'; 
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardView />;
      case 'tracking': return <TrackingView />;
      case 'challenges': return <ChallengesView />;
      case 'spending-limits': return <SpendingLimitsView />;
      case 'credit-cards': return <CreditCardView />;
      case 'conscious-spending': return <ConsciousSpendingView />;
      case 'summaries': return <SummariesView />;
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