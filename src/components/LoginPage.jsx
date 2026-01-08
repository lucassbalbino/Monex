
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Lock, Loader2, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from 'react-helmet';

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error("Email ou senha incorretos.");
        }
        throw authError;
      }

      if (user) {
        // 2. Check Subscription Status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.subscription_status !== 'active' && profile?.subscription_status !== 'trialing') {
          toast({
            title: "Assinatura pendente",
            description: "Você precisa completar sua assinatura para acessar o sistema.",
            className: "bg-blue-600 text-white border-none"
          });
          // Redirect to payment if subscription is not active
          navigate('/payment');
          return;
        }

        // 3. Success
        toast({
          title: "Login realizado com sucesso",
          description: "Redirecionando para o dashboard...",
          className: "bg-green-600 text-white border-none"
        });
        
        navigate('/');
      }
    } catch (error) {
      console.error('Login Error:', error);
      toast({
        variant: "destructive",
        title: "Erro no acesso",
        description: error.message || "Ocorreu um erro inesperado.",
        className: "border-red-600"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Helmet>
        <title>Monex - Entrar</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-[#1E293B] rounded-2xl border border-[#334155] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="bg-[#14B8A6]/20 p-4 rounded-full mb-4">
            <LogIn className="h-8 w-8 text-[#14B8A6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acesse sua conta</h1>
          <p className="text-gray-400 text-sm mt-2">Gerencie suas finanças com inteligência.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6] pl-10"
                required
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6] pl-10"
                required
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold mt-6 shadow-lg shadow-[#14B8A6]/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Entrar na Plataforma <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-[#334155] text-center relative z-10">
          <p className="text-gray-500 text-xs mb-2">Ainda não tem acesso?</p>
          <Button variant="link" className="text-[#14B8A6] hover:text-[#0D9488] text-sm font-medium" onClick={() => navigate('/')}>
            Conheça nossos planos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
