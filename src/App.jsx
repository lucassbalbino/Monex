import React, { useState, useEffect, useRef } from 'react';
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

// Contador de renderização para debug
let renderCount = 0;

function App() {
  // Debug: conta renderizações
  renderCount++;
  if (renderCount > 50) {
    console.error("[LOOP DETECTADO] App renderizou", renderCount, "vezes!");
    // Força parada para evitar crash
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center p-8">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">⚠️ Loop de Renderização Detectado</h1>
          <p>O App renderizou mais de 50 vezes.</p>
          <p className="mt-2 text-sm">Abra o console (F12) para mais detalhes.</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-4 px-4 py-2 bg-white text-red-900 rounded"
          >
            Limpar Cache e Recarregar
          </button>
        </div>
      </div>
    );
  }
  console.log("[App] Render #" + renderCount);
  
  const [session, setSession] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); 
  const [profileRole, setProfileRole] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ step: 'iniciando', error: null });
  
  // Ref para prevenir múltiplas inicializações
  const initRef = useRef(false);

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
  
  // Initialization - TOTALMENTE REESCRITO
  useEffect(() => {
    // Previne múltiplas execuções
    if (initRef.current) return;
    initRef.current = true;
    
    console.log("[App] useEffect de auth iniciado");
    
    let mounted = true;

    const init = async () => {
      try {
        setDebugInfo({ step: 'Verificando variáveis...', error: null });
        
        // Verifica variáveis de ambiente
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log("[App] ENV URL:", !!url);
        console.log("[App] ENV Key:", !!key);
        
        if (!url || !key) {
          console.error("[App] Variáveis de ambiente faltando!");
          setDebugInfo({ step: 'Erro: variáveis não configuradas', error: 'ENV_MISSING' });
          setLoading(false);
          return;
        }
        
        setDebugInfo({ step: 'Buscando sessão...', error: null });
        console.log("[App] Chamando getSession...");
        
        const { data, error } = await supabase.auth.getSession();
        
        console.log("[App] getSession retornou:", { hasSession: !!data?.session, error: error?.message });
        
        if (!mounted) {
          console.log("[App] Componente desmontado, abortando");
          return;
        }
        
        if (error) {
          console.error("[App] Erro:", error.message);
          setDebugInfo({ step: 'Erro ao buscar sessão', error: error.message });
          setSession(null);
          setLoading(false);
          return;
        }
        
        const currentSession = data?.session;
        
        if (currentSession?.user?.id) {
          console.log("[App] Sessão encontrada, buscando perfil...");
          setSession(currentSession);
          setDebugInfo({ step: 'Buscando perfil...', error: null });
          
          // Busca perfil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_status, role')
            .eq('id', currentSession.user.id)
            .single();
          
          if (!mounted) return;
          
          if (profileError) {
            console.warn("[App] Erro ao buscar perfil:", profileError.message);
          }
          
          console.log("[App] Perfil:", profile);
          setSubscriptionStatus(profile?.subscription_status ?? null);
          setProfileRole(profile?.role ?? null);
        } else {
          console.log("[App] Sem sessão ativa");
          setSession(null);
          setSubscriptionStatus(null);
          setProfileRole(null);
        }
        
        setDebugInfo({ step: 'Concluído', error: null });
        
      } catch (err) {
        console.error("[App] Erro crítico:", err);
        setDebugInfo({ step: 'Erro crítico', error: err.message });
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          console.log("[App] Finalizando loading");
          setLoading(false);
        }
      }
    };

    init();

    // Listener de auth - simplificado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[App] Auth event:", event);
      
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return; // Já processado
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSubscriptionStatus(null);
        setProfileRole(null);
      } else if (event === 'SIGNED_IN' && newSession?.user?.id) {
        setSession(newSession);
        // Busca perfil assíncrona sem await para não bloquear
        supabase
          .from('profiles')
          .select('subscription_status, role')
          .eq('id', newSession.user.id)
          .single()
          .then(({ data: profile }) => {
            if (mounted) {
              setSubscriptionStatus(profile?.subscription_status ?? null);
              setProfileRole(profile?.role ?? null);
            }
          });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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