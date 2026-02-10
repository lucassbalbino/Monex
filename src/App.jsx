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
import { Loader2 } from 'lucide-react';


function App() {
  const [session, setSession] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); 
  const [profileRole, setProfileRole] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
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
  
  // Inicialização da autenticação
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          setSession(null);
          setLoading(false);
          return;
        }
        
        const currentSession = data?.session;
        
        if (currentSession?.user?.id) {
          setSession(currentSession);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status, role')
            .eq('id', currentSession.user.id)
            .single();
          
          if (mounted) {
            setSubscriptionStatus(profile?.subscription_status ?? null);
            setProfileRole(profile?.role ?? null);
          }
        } else {
          setSession(null);
          setSubscriptionStatus(null);
          setProfileRole(null);
        }
        
      } catch (err) {
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSubscriptionStatus(null);
        setProfileRole(null);
      } else if (event === 'SIGNED_IN' && newSession?.user?.id) {
        setSession(newSession);
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