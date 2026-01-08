
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('ID da sessão não encontrado. Retorne à página inicial.');
      return;
    }

    const verifySession = async () => {
      try {
        // 1. Check if user is already logged in locally
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        // 2. Retrieve Stripe session details via Edge Function
        const { data, error } = await supabase.functions.invoke('get-stripe-session', {
          body: { sessionId }
        });

        if (error) {
          console.error('Edge Function Error:', error);
          throw new Error('Falha na comunicação com o servidor de pagamentos.');
        }
        
        if (!data || data.paymentStatus !== 'paid') {
          if (data?.paymentStatus === 'unpaid') {
             throw new Error('O pagamento ainda está sendo processado. Você receberá um email quando for confirmado.');
          }
          throw new Error('O pagamento não foi confirmado pelo sistema bancário.');
        }

        setStatus('success');

        // 3. Intelligent Redirection logic
        // We give the user a moment to see the success checkmark
        setTimeout(() => {
          if (authSession) {
            // CASE A: User was already logged in
            toast({
              title: "Assinatura Confirmada!",
              description: "Seu plano foi ativado com sucesso.",
              duration: 5000,
              className: "bg-green-600 text-white border-none",
            });
            navigate('/');
          } else {
            // CASE B: New user (Flow requested by user)
            // Redirect to registration to create account using the email from Stripe
            navigate('/register', { 
              state: { 
                email: data.email, 
                name: data.name,
                stripeCustomerId: data.customerId,
                subscriptionId: data.subscriptionId,
                planType: 'premium' 
              }
            });
          }
        }, 2500);

      } catch (err) {
        console.error('Error verifying checkout:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Falha ao verificar o pagamento. Entre em contato com o suporte.');
      }
    };

    verifySession();
  }, [searchParams, navigate, toast]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="h-16 w-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Ops! Algo deu errado.</h1>
        <p className="text-gray-400 mb-8 max-w-md">{errorMessage}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="text-white border-white/20 hover:bg-white/10">
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
      {status === 'loading' ? (
        <>
          <Loader2 className="h-16 w-16 text-[#14B8A6] animate-spin mb-6" />
          <h1 className="text-2xl font-bold mb-2">Confirmando pagamento...</h1>
          <p className="text-gray-400">Estamos validando sua transação segura.</p>
        </>
      ) : (
        <>
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.5 }}
          >
            <CheckCircle2 className="h-20 w-20 text-green-500 mb-6 mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4 text-white">Pagamento Aprovado!</h1>
          <p className="text-gray-400 mb-8 text-lg">Agora vamos criar seu acesso ao Monex.</p>
          <div className="flex gap-2 items-center justify-center text-[#14B8A6] font-medium animate-pulse">
             Redirecionando para cadastro <ArrowRight className="h-4 w-4" />
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutSuccessPage;
