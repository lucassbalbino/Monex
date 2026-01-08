
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from 'react-helmet';

const AdminLoginPage = () => {
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

      if (authError) throw authError;

      if (user) {
        // 2. Check if user is actually an admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          // Log out immediately if not admin
          await supabase.auth.signOut();
          throw new Error("Acesso negado. Esta conta não possui privilégios administrativos.");
        }

        toast({
          title: "Login Admin realizado",
          description: "Bem-vindo ao painel administrativo.",
          className: "bg-red-900 text-white border-none"
        });
        
        navigate('/admin');
      }
    } catch (error) {
      console.error('Admin Login Error:', error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Credenciais inválidas ou erro no servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <Helmet>
        <title>Monex Admin - Login</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-red-900/30 p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Área Administrativa</h1>
          <p className="text-gray-400 text-sm mt-2">Acesso restrito a administradores do sistema.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email Administrativo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@financialflow.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-[#1E293B] border-[#334155] text-white focus:border-red-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Senha Mestra</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-[#1E293B] border-[#334155] text-white focus:border-red-500 pr-10"
                required
              />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold mt-6"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                Acessar Painel <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-[#1E293B] text-center">
          <Button variant="link" className="text-gray-500 hover:text-white text-xs" onClick={() => navigate('/')}>
            ← Voltar para o site principal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
