
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    // 1. Try to get plan from navigation state
    let plan = location.state?.plan;

    // 2. Fallback: Try to get from session storage
    if (!plan) {
      const stored = sessionStorage.getItem('monex_selected_plan');
      if (stored) {
        try {
          plan = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse stored plan", e);
        }
      }
    }

    // 3. Last Resort Fallback - Default to Monthly (id will be resolved from DB)
    if (!plan) {
      plan = {
        name: 'Mensal',
        price: 34.90,
        interval: 'mês'
      };
    }

    setSelectedPlan(plan);
  }, [location.state]);

  const handleCheckout = async () => {
    if (!user || !selectedPlan) return;
    setLoading(true);

    try {
      logger.info('Iniciando checkout', { planName: selectedPlan.name });
      // Prefer explicit stripe_price_id on plan, fall back to id
      let priceId = selectedPlan?.stripe_price_id || selectedPlan?.priceId || selectedPlan?.id;

      // If no priceId available (e.g. plan came without id), try to resolve from DB
      if (!priceId) {
        try {
          const { data: planFromDb, error } = await supabase
            .from('plans')
            .select('id, name, stripe_price_id, stripe_price_id_test')
            .ilike('name', selectedPlan?.name || '')
            .limit(1)
            .maybeSingle();

          if (!error && planFromDb) {
            const isProd = import.meta.env.MODE === 'production';
            priceId = isProd
              ? planFromDb.stripe_price_id || planFromDb.id
              : planFromDb.stripe_price_id_test || planFromDb.stripe_price_id || planFromDb.id;
            logger.info('PriceId resolvido do banco de dados', { priceId });
          }
        } catch (e) {
          console.warn('[PaymentPage] failed to resolve priceId from DB', e);
        }
      }

      if (!priceId) {
        // Final fallback: try to fetch any plan from DB and use its id
        try {
          const { data: anyPlan, error: anyPlanErr } = await supabase
            .from('plans')
            .select('id, name, stripe_price_id, stripe_price_id_test')
            .limit(1)
            .maybeSingle();

          if (!anyPlanErr && anyPlan) {
            const isProd = import.meta.env.MODE === 'production';
            priceId = isProd
              ? anyPlan.stripe_price_id || anyPlan.id
              : anyPlan.stripe_price_id_test || anyPlan.stripe_price_id || anyPlan.id;
            logger.info('PriceId resolvido do fallback', { priceId });
          }
        } catch (e) {
          console.warn('[PaymentPage] failed to fetch fallback plan', e);
        }
      }

      if (!priceId) {
        setLoading(false);
        toast({
          title: 'Plano inválido',
          description: 'Não foi possível determinar o plano. Selecione um plano novamente.',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      const payload = {
        priceId,
        email: user.email,
        userId: user.id,
        origin: window.location.origin
      };

      logger.info('Payload para create-checkout-session', { payloadKeys: Object.keys(payload) });

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: payload
      });

      if (error) {
        console.error('Edge function error:', error);
        // log any returned data for diagnostics
        console.error('Edge function returned data:', data);
        throw error;
      }
      
      // Use the URL returned by the backend to redirect (checkoutUrl or generic url)
      const redirectUrl = data?.checkoutUrl || data?.url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // If backend returned only a sessionId, use Stripe.js to redirect
      if (data?.sessionId) {
        const stripe = await loadStripe("pk_test_51SmEju1SX0uvm0LejFgXv1vZf6pfHAgcbxkXyyffAeBM8J7An5MdauhCO4XDnavp4259NSAXjucg0rQIJtFqMOMZ00qbMv2Pk3");
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (stripeError) throw stripeError;
        return;
      }

      throw new Error('URL de pagamento não encontrada.');

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Erro ao iniciar pagamento",
        description: "Não foi possível conectar com o Stripe. Tente novamente.",
      });
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!selectedPlan) return null;

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] mb-4">
            <CreditCard className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pagamento Seguro</h1>
          <p className="text-gray-400 mt-2">
            Finalize sua assinatura para liberar o acesso.
          </p>
        </div>

        <Card className="bg-[#1E293B] border-[#334155] text-white shadow-2xl overflow-hidden">
          <CardHeader className="bg-[#020617]/50 border-b border-[#334155] pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-gray-200">Plano Selecionado</CardTitle>
                <CardTitle className="text-2xl font-bold text-[#14B8A6] mt-1">{selectedPlan.name}</CardTitle>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">R$ {selectedPlan.price?.toFixed(2).replace('.', ',')}</span>
                <span className="text-sm text-gray-500 block">/{selectedPlan.interval}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 className="h-5 w-5 text-[#14B8A6] shrink-0" />
                <span>Acesso imediato ao Dashboard</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 className="h-5 w-5 text-[#14B8A6] shrink-0" />
                <span>Cancelamento a qualquer momento</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 mt-4">
              <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-200 leading-relaxed">
                Ambiente criptografado. Nenhuma informação de cartão é salva em nossos servidores.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 bg-[#020617]/30 pt-6">
            <Button 
              className="w-full h-12 text-lg bg-[#14B8A6] hover:bg-[#0D9488] shadow-lg shadow-[#14B8A6]/20"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Ir para Pagamento'
              )}
            </Button>
            
            <div className="flex items-center justify-between w-full mt-2">
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-500 hover:text-white text-xs"
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Sair / Outra conta
              </Button>
               <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate('/')} 
                className="text-gray-500 text-xs"
              >
                Alterar Plano
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentPage;
