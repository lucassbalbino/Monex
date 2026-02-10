import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import PlansPage from '@/components/PlansPage';
import RegisterPage from '@/components/RegisterPage';
import LoginPage from '@/components/LoginPage';
import PaymentPage from '@/components/PaymentPage';
import CheckoutSuccessPage from '@/components/CheckoutSuccessPage';
import AdminLoginPage from '@/components/AdminLoginPage';
import AdminDashboard from '@/components/AdminDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { FinancialProvider } from '@/context/FinancialContext';
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';


function App() {
  const [session, setSession] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); 
  const [profileRole, setProfileRole] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ step: 'iniciando', error: null });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;

    if (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSidebarOpen]);
  
  // Initialization - SIMPLIFICADO para evitar loops em produção
  useEffect(() => {
    let mounted = true;
    let authListener = null;
    
    // Timeout de segurança - se demorar mais de 10s, para de carregar
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.error("[Auth] TIMEOUT - forçando fim do loading");
        setDebugInfo(prev => ({ ...prev, step: 'TIMEOUT após 10s', error: 'Timeout' }));
        setLoading(false);
      }
    }, 10000);

    const initAuth = async () => {
      console.log("[Auth] Iniciando...");
      setDebugInfo({ step: 'Conectando ao Supabase...', error: null });
      
      try {
        // Verifica se as variáveis estão configuradas
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.error("[Auth] VARIÁVEIS DE AMBIENTE NÃO CONFIGURADAS!");
          setDebugInfo({ step: 'ERRO: Variáveis não configuradas', error: 'ENV_MISSING' });
          setLoading(false);
          return;
        }
        
        setDebugInfo({ step: 'Buscando sessão...', error: null });
        
        // Passo 1: Obter sessão atual
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("[Auth] Erro getSession:", error.message);
          setDebugInfo({ step: 'Erro ao buscar sessão', error: error.message });
          setSession(null);
          setSubscriptionStatus(null);
          setProfileRole(null);
          setLoading(false);
          return;
        }
        
        const currentSession = data?.session;
        console.log("[Auth] Sessão:", currentSession ? "existe" : "null");
        setDebugInfo({ step: currentSession ? 'Sessão encontrada' : 'Sem sessão', error: null });
        
        if (currentSession?.user?.id) {
          setSession(currentSession);
          setDebugInfo({ step: 'Buscando perfil...', error: null });
          // Busca perfil em paralelo
          fetchSubscriptionStatus(currentSession.user.id);
        } else {
          setSession(null);
          setSubscriptionStatus(null);
          setProfileRole(null);
        }
        
      } catch (err) {
        console.error("[Auth] Erro init:", err);
        setDebugInfo({ step: 'Erro na inicialização', error: err.message });
        if (mounted) {
          setSession(null);
          setSubscriptionStatus(null);
          setProfileRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setDebugInfo(prev => ({ ...prev, step: prev.error ? prev.step : 'Concluído' }));
          console.log("[Auth] Loading = false");
        }
      }
    };

    // Configura listener ANTES de inicializar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[Auth] Evento:", event);
      
      if (!mounted) return;
      
      // Ignora INITIAL_SESSION pois já processamos no initAuth
      if (event === 'INITIAL_SESSION') return;
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSubscriptionStatus(null);
        setProfileRole(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user?.id) {
          setSession(newSession);
          fetchSubscriptionStatus(newSession.user.id);
        }
      }
    });
    
    authListener = subscription;
    
    // Inicia verificação de sessão
    initAuth();

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const fetchSubscriptionStatus = async (userId) => {
    console.log("[Auth] Buscando perfil para:", userId);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn("[Auth] Erro ao buscar perfil:", error.message);
        setSubscriptionStatus(null);
        setProfileRole(null);
        return;
      }
      
      console.log("[Auth] Perfil:", profile?.subscription_status, profile?.role);
      
      setSubscriptionStatus(profile?.subscription_status ?? null);
      setProfileRole(profile?.role ?? null);
    } catch (e) {
      console.error("[Auth] Erro:", e);
      setSubscriptionStatus(null);
      setProfileRole(null);
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#14B8A6] animate-spin" />
        {/* Debug info - REMOVER DEPOIS DE RESOLVER O PROBLEMA */}
        <div className="text-xs text-gray-400 text-center max-w-md p-4 bg-[#1E293B] rounded-lg border border-gray-700">
          <p className="font-semibold text-white mb-2">Debug de Autenticação</p>
          <p className="mb-1">
            Status: <span className="text-[#14B8A6]">{debugInfo.step}</span>
          </p>
          {debugInfo.error && (
            <p className="text-red-400 mb-1">Erro: {debugInfo.error}</p>
          )}
          <hr className="border-gray-600 my-2" />
          <p>
            VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? 
              <span className="text-green-400">✓ Configurada</span> : 
              <span className="text-red-400">✗ NÃO CONFIGURADA</span>}
          </p>
          <p>
            VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 
              <span className="text-green-400">✓ Configurada</span> : 
              <span className="text-red-400">✗ NÃO CONFIGURADA</span>}
          </p>
          <hr className="border-gray-600 my-2" />
          <p className="text-gray-500 text-[10px]">
            Se este painel ficar visível por mais de 5 segundos, há um problema.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = profileRole === 'admin';
  // Check if user has a valid active subscription
  const hasActiveSubscription = isAdmin || subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return (
    <ErrorBoundary>
      <Helmet>
        <title>Monex - Seu Assistente Financeiro Pessoal</title>
      </Helmet>
      
      <Routes>
        <Route path="/admin-login" element={isAdmin ? <Navigate to="/admin" replace /> : <AdminLoginPage />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} />
        <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
        
        {/* Payment Route: Available to logged in users */}
        <Route 
          path="/payment" 
          element={session ? <PaymentPage /> : <Navigate to="/login" replace />} 
        />
        
        {/* Auth Routes */}
        <Route 
          path="/register" 
          element={session ? <Navigate to="/" replace /> : <RegisterPage />} 
        />
        <Route 
          path="/login" 
          element={session ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        
        {/* Landing Page */}
        <Route 
          path="/landing" 
          element={!session || isAdmin ? <LandingPage /> : <Navigate to="/" replace />} 
        />

        {/* Plans selector */}
        <Route path="/plans" element={<PlansPage />} />
        
        {/* Main Application Route */}
        <Route path="/" element={
           !session ? (
             <LandingPage /> 
           ) : hasActiveSubscription ? (
            <FinancialProvider>
                <div className="min-h-screen bg-[#0F172A] text-white">
                  <Sidebar 
                    activeSection={activeSection} 
                    setActiveSection={handleSectionChange} 
                    isOpen={isSidebarOpen} 
                    onClose={() => setSidebarOpen(false)}
                  />

                  <div className="lg:pl-64">
                    <Header 
                      onShowLanding={() => {}} 
                      onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                      isSidebarOpen={isSidebarOpen}
                    />
                    <main className="p-4 sm:p-6">
                      <Dashboard activeSection={activeSection} />
                    </main>
                  </div>
                </div>
            </FinancialProvider>
           ) : (
             // Logged in but no subscription -> Redirect to payment
             <Navigate to="/payment" replace />
           )
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </ErrorBoundary>
  );
}

export default App;