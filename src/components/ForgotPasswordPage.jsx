import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setExpired(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Falha ao enviar email',
          description: error.message || 'Não foi possível enviar o email de recuperação.',
        });
      } else {
        setSent(true);
        toast({
          title: 'Email enviado',
          description: 'Verifique sua caixa de entrada para instruções de recuperação.',
          className: 'bg-green-600 text-white border-none',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Ocorreu um erro inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Helmet><title>Monex - Recuperar Senha</title></Helmet>

      <div className="w-full max-w-md bg-[#1E293B] rounded-2xl border border-[#334155] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="bg-[#14B8A6]/20 p-4 rounded-full mb-4">
            <Mail className="h-8 w-8 text-[#14B8A6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="text-gray-400 text-sm mt-2">
            {sent
              ? 'Enviamos um link de recuperação para o seu email.'
              : 'Informe o email cadastrado e enviaremos instruções para redefinir sua senha.'}
          </p>
        </div>

        {expired && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3 relative z-10">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-medium">Link expirado ou inválido</p>
              <p className="text-gray-400 text-xs mt-1">O link de recuperação que você usou expirou. Solicite um novo abaixo.</p>
            </div>
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6] pl-10"
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold mt-4 shadow-lg shadow-[#14B8A6]/20"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                'Enviar email de recuperação'
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center relative z-10">
            <p className="text-gray-400 text-sm mb-4">Não recebeu? Verifique sua pasta de spam ou tente novamente.</p>
            <Button
              variant="outline"
              onClick={() => setSent(false)}
              className="border-[#334155] text-[#14B8A6] hover:bg-[#14B8A6]/10"
            >
              Reenviar email
            </Button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#334155] text-center relative z-10">
          <Button variant="link" onClick={() => navigate('/login')} className="text-[#14B8A6] hover:text-[#0D9488] text-sm font-medium">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
