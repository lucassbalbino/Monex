import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from 'react-helmet';

const ConfirmEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = location.state?.email || '';
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Subscribe to auth changes (user may be signed-in after clicking the confirmation link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        toast({ title: 'Email confirmado', description: 'Bem-vindo!', className: 'bg-green-600 text-white' });
        navigate('/', { replace: true });
      }
    });

    // Poll for session/user as a fallback
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (user && user.email_confirmed_at) {
          if (!mounted) return;
          toast({ title: 'Email confirmado', description: 'Redirecionando...', className: 'bg-green-600 text-white' });
          navigate('/', { replace: true });
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleResend = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email ausente', description: 'Não foi possível reenviar sem o email.' });
      return;
    }

    setSending(true);
    try {
      // Envia um magic link de login — alternativa prática para reenviar acesso
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({ title: 'Email enviado', description: `Verifique ${email}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao reenviar', description: err.message || 'Tente novamente.' });
    } finally {
      setSending(false);
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (user && user.email_confirmed_at) {
        toast({ title: 'Confirmado', description: 'Redirecionando...', className: 'bg-green-600 text-white' });
        navigate('/', { replace: true });
      } else {
        toast({ title: 'Ainda não confirmado', description: 'Verifique o email e tente novamente.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message || 'Tente novamente.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Helmet>
        <title>Monex - Confirme seu Email</title>
      </Helmet>

      <div className="w-full max-w-lg bg-[#1E293B] rounded-2xl p-8 border border-[#334155] shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#14B8A6]/20 text-[#14B8A6] mb-4 mx-auto">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Confirme seu email</h2>
        <p className="text-gray-300 mb-4">Enviamos um link de confirmação para <strong className="text-white">{email || 'seu email'}</strong>. Abra o email e clique no link para confirmar sua conta.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Button onClick={handleResend} disabled={sending} className="flex items-center justify-center">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Reenviar link
          </Button>

          <Button variant="secondary" onClick={handleManualCheck} disabled={checking} className="flex items-center justify-center">
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Já confirmei
          </Button>
        </div>

        <div className="mt-6 text-sm text-gray-400">Se não receber o email, verifique sua caixa de SPAM ou aguarde alguns minutos.</div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
