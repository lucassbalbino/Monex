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
  
  // Initialization
  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    const initSession = async () => {
      logger.info("[Auth] Iniciando verificação de sessão...");
      
      // Debug: verificar o que está no localStorage
      const storedSession = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      logger.info("[Auth] Token no localStorage:", storedSession ? "Existe" : "Não existe");
      
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error("[Auth] Erro ao obter sessão:", error);
          // Limpa sessão corrompida
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setSubscriptionStatus(null);
            setProfileRole(null);
            setLoading(false);
          }
          return;
        }
        
        // Verifica se a sessão está expirada
        if (currentSession) {
          const expiresAt = currentSession.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const isExpired = expiresAt && expiresAt < now;
          
          logger.info("[Auth] Sessão encontrada - expira em:", expiresAt ? new Date(expiresAt * 1000).toLocaleString() : "N/A");
          logger.info("[Auth] Sessão expirada?", isExpired);
          
          if (isExpired) {
            logger.warn("[Auth] Sessão expirada, tentando refresh...");
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshData.session) {
              logger.error("[Auth] Falha ao renovar sessão:", refreshError);
              await supabase.auth.signOut();
              if (mounted) {
                setSession(null);
                setSubscriptionStatus(null);
                setProfileRole(null);
                setLoading(false);
              }
              return;
            }
            
            logger.info("[Auth] Sessão renovada com sucesso");
            if (mounted) {
              setSession(refreshData.session);
              await fetchSubscriptionStatus(refreshData.session.user.id);
              isInitialized = true;
              setLoading(false);
            }
            return;
          }
        }
        
        logger.info("[Auth] Sessão obtida:", currentSession ? "Usuário logado" : "Sem sessão");
        
        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            await fetchSubscriptionStatus(currentSession.user.id);
          } else {
            setSession(null);
            setSubscriptionStatus(null);
            setProfileRole(null);
          }
          isInitialized = true;
        }
      } catch (err) {
        logger.error("[Auth] Session init error:", err);
        // Em caso de erro, limpa tudo para evitar loop
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // ignora erro de signOut
        }
        if (mounted) {
          setSession(null);
          setSubscriptionStatus(null);
          setProfileRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          logger.info("[Auth] Loading finalizado");
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.info("[Auth] onAuthStateChange:", event, newSession ? "com sessão" : "sem sessão");
      
      if (!mounted) return;
      
      // Evita processar eventos durante a inicialização
      if (!isInitialized && event === 'INITIAL_SESSION') {
        logger.info("[Auth] Ignorando INITIAL_SESSION - já processado por initSession");
        return;
      }
      
      // Se o token foi renovado automaticamente, apenas atualiza
      if (event === 'TOKEN_REFRESHED') {
        logger.info("[Auth] Token renovado automaticamente");
        if (newSession) {
          setSession(newSession);
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSubscriptionStatus(null);
        setProfileRole(null);
      } else if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        await fetchSubscriptionStatus(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchSubscriptionStatus = async (userId) => {
    logger.info("[Auth] Buscando status da assinatura para userId:", userId);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        logger.error("[Auth] Erro ao buscar perfil:", error);
        // Se o perfil não existir, permite acesso mas sem subscription ativa
        setSubscriptionStatus(null);
        setProfileRole(null);
        return;
      }
      
      logger.info("[Auth] Perfil encontrado - status:", profile?.subscription_status, "role:", profile?.role);
      
      setSubscriptionStatus(profile?.subscription_status ?? null);
      setProfileRole(profile?.role ?? null);
    } catch (e) {
      logger.error("[Auth] Error fetching status:", e);
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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#14B8A6] animate-spin" />
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