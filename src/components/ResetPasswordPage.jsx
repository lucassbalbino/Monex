import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Aguarda o Supabase detectar a sessão de recovery via URL hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Verifica se já existe sessão (caso o evento já tenha ocorrido)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // Dá um tempo para o hash ser processado
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setSessionReady(true);
            else setSessionError(true);
          });
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Senha fraca', description: 'Use ao menos 6 caracteres.' });
      return;
    }
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Senhas não coincidem', description: 'As senhas digitadas devem ser iguais.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar senha',
        description: error.message || 'Não foi possível redefinir a senha.',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Senha atualizada!',
      description: 'Você já pode entrar com a nova senha.',
      className: 'bg-green-600 text-white border-none',
    });

    // Sign out para forçar novo login com a senha atualizada
    await supabase.auth.signOut();
    setLoading(false);
    navigate('/login');
  };

  if (sessionError) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <Helmet><title>Monex - Link Inválido</title></Helmet>
        <div className="w-full max-w-md bg-[#1E293B] rounded-2xl border border-[#334155] p-8 shadow-2xl text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-400 text-sm mb-6">Solicite um novo email de recuperação.</p>
          <Button onClick={() => navigate('/forgot-password')} className="bg-[#14B8A6] hover:bg-[#0D9488] text-white">
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#14B8A6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Helmet><title>Monex - Redefinir Senha</title></Helmet>

      <div className="w-full max-w-md bg-[#1E293B] rounded-2xl border border-[#334155] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="bg-[#14B8A6]/20 p-4 rounded-full mb-4">
            <Lock className="h-8 w-8 text-[#14B8A6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Redefinir senha</h1>
          <p className="text-gray-400 text-sm mt-2">Escolha uma nova senha para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6] pl-10"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            {password && password.length < 6 && (
              <p className="text-xs text-red-400">Mínimo de 6 caracteres</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-300">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6] pl-10"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            {confirm && password !== confirm && (
              <p className="text-xs text-red-400">As senhas não coincidem</p>
            )}
            {confirm && password === confirm && confirm.length >= 6 && (
              <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Senhas coincidem</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirm}
            className="w-full h-12 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold mt-4 shadow-lg shadow-[#14B8A6]/20"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...</>
            ) : (
              'Atualizar senha'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
