
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, User, Mail, Phone, Lock, Shield, CreditCard } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from 'react-helmet';

const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Data from previous steps
  const stateData = location.state || {};
  const selectedPlan = stateData.plan;

  const [formData, setFormData] = useState({
    fullName: stateData.name || '',
    email: stateData.email || '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // CRITICAL: Persist plan immediately when landing on this page
    if (selectedPlan) {
      sessionStorage.setItem('monex_selected_plan', JSON.stringify(selectedPlan));
    }
  }, [selectedPlan]);

  // Phone mask helper
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const formatted = formatPhone(value);
      if (formatted.length <= 15) {
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password || !formData.confirmPassword) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Por favor, preencha todos os campos." });
      return false;
    }
    if (formData.password.length < 8) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "Mínimo de 8 caracteres." });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Senhas não conferem", description: "Verifique a confirmação de senha." });
      return false;
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast({ variant: "destructive", title: "Telefone inválido", description: "Digite um número válido com DDD." });
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("registered") || signUpError.status === 422) {
           throw new Error("Este email já possui cadastro. Faça login.");
        }
        throw signUpError;
      }

      if (data.user) {
        // 2. Profile Creation
        const updates = {
          id: data.user.id,
          email: formData.email,
          full_name: formData.fullName,
          updated_at: new Date().toISOString()
        };

        await supabase.from('profiles').upsert(updates);

        toast({
          title: "Conta criada com sucesso!",
          description: "Redirecionando para o pagamento...",
          className: "bg-green-600 text-white border-none",
        });
        
        // 3. FORCE REDIRECT TO PAYMENT
        // We use window.location as a fallback to ensure we break out of any router state traps
        // but prefer navigate for SPA feel. Since App.jsx might redirect to /, we trust App.jsx
        // to eventually route to /payment if subscription is missing, but let's be explicit.
        navigate('/payment');

      } else {
        toast({ title: "Verifique seu email", description: "Confirmação enviada." });
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Helmet>
        <title>Monex - Criar Conta</title>
      </Helmet>
      
      <div className="w-full max-w-lg bg-[#1E293B] rounded-2xl p-8 border border-[#334155] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#14B8A6] to-blue-600"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#14B8A6]/20 text-[#14B8A6] mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
          {selectedPlan ? (
             <div className="mt-2 bg-[#14B8A6]/10 inline-block px-3 py-1 rounded-full border border-[#14B8A6]/20">
               <span className="text-xs text-[#14B8A6] flex items-center gap-1">
                 <CreditCard className="h-3 w-3" /> Plano Selecionado: <strong>{selectedPlan.name}</strong>
               </span>
             </div>
          ) : (
            <p className="text-gray-400 mt-2 text-sm">Preencha os dados para prosseguir.</p>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-300">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input id="fullName" name="fullName" placeholder="Ex: João da Silva" value={formData.fullName} onChange={handleChange} className="pl-10 bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input 
                id="email" name="email" type="email" placeholder="seu@email.com" 
                value={formData.email} onChange={handleChange} 
                className="pl-10 bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Celular</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" value={formData.phone} onChange={handleChange} className="pl-10 bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input id="password" name="password" type="password" placeholder="Min. 8 caracteres" value={formData.password} onChange={handleChange} className="pl-10 bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repita a senha" value={formData.confirmPassword} onChange={handleChange} className="pl-10 bg-[#0F172A] border-[#334155] text-white focus:border-[#14B8A6]" />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-[#14B8A6] hover:bg-[#0D9488] font-bold text-white mt-8 shadow-lg shadow-[#14B8A6]/20" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : <>{selectedPlan ? 'Continuar para Pagamento' : 'Criar Conta'} <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
          
          <div className="mt-4 text-center">
             <Button variant="link" onClick={() => navigate('/login')} className="text-[#14B8A6] text-sm">Já tenho conta</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
