
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

// Initialize Stripe outside component
const stripePromise = loadStripe("pk_live_51SmEju1SX0uvm0LeCfl4THqZvIW8t6fxNrwCSzSRUOLYpf9mdkkPzH7c9JNbNkchm6j5GBVBKBMNowCdnIYkLRuc00vL5qiMbo");

export default function SubscriptionModal({ isOpen, onOpenChange, selectedPlan }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log(`[SubscriptionModal] Modal OPENING. Plan: ${selectedPlan?.name}`);
    }
  }, [isOpen, selectedPlan]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para continuar.",
        variant: "destructive"
      });
      return false;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    console.log('[SubscriptionModal] Starting subscription process...');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('[SubscriptionModal] Saving temp data...');
      sessionStorage.setItem('monex_pending_signup', JSON.stringify(formData));

      console.log('[SubscriptionModal] Invoking edge function create-checkout-session...');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: selectedPlan.id,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          origin: window.location.origin
        }
      });

      if (error) {
        console.error('[SubscriptionModal] Edge function error:', error);
        throw error;
      }
      
      if (!data?.sessionId) {
        console.error('[SubscriptionModal] No session ID returned:', data);
        throw new Error('Sessão inválida retornada');
      }

      console.log('[SubscriptionModal] Redirecting to Stripe with session:', data.sessionId);
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (stripeError) throw stripeError;

    } catch (error) {
      console.error('[SubscriptionModal] Checkout error:', error);
      toast({
        title: "Erro no checkout",
        description: error.message || "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // If no plan is selected yet, we can render null or an empty dialog (though isOpen should be false)
  if (!selectedPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1E293B] border-[#334155] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#14B8A6]" />
            Checkout Seguro
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie sua conta para acessar o plano <span className="text-[#14B8A6] font-medium">{selectedPlan?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubscribe} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-300">Nome Completo</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Seu nome"
              value={formData.fullName}
              onChange={handleChange}
              className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Celular (com DDD)</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={handleChange}
              className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Senha de Acesso</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]"
            />
          </div>

          <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/50 flex items-start gap-3 mt-4">
            <Lock className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
            <p className="text-xs text-blue-200">
              Seus dados estão protegidos. Você será redirecionado para o ambiente seguro do Stripe para finalizar o pagamento.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-[#14B8A6] hover:bg-[#0D9488] font-bold text-white mt-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              `Ir para Pagamento (R$ ${selectedPlan?.price?.toFixed(2).replace('.', ',')})`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
