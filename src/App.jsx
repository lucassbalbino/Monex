import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
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
import { initializeAdmin } from '@/lib/adminInit';
import { Loader2 } from 'lucide-react';


function App() {
  const [session, setSession] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); 
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Initialization
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        initializeAdmin();

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            await fetchSubscriptionStatus(currentSession.user.id);
          } else {
            setSession(null);
            setSubscriptionStatus(null);
          }
        }
      } catch (err) {
        console.error("Session init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSubscriptionStatus(null);
      } else if (newSession) {
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
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single();
      
      setSubscriptionStatus(profile?.subscription_status);
    } catch (e) {
      console.error("Error fetching status", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#14B8A6] animate-spin" />
      </div>
    );
  }

  const isAdmin = session?.user?.email === 'admin@financialflow.com';
  // Check if user has a valid active subscription
  const hasActiveSubscription = isAdmin || subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return (
    <ErrorBoundary>
      <Helmet>
        <title>Monex - Seu Assistente Financeiro Pessoal</title>
      </Helmet>
      
      <Routes>
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
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
        
        {/* Main Application Route */}
        <Route path="/" element={
           !session ? (
             <LandingPage /> 
           ) : hasActiveSubscription ? (
            <FinancialProvider>
              <div className="min-h-screen bg-[#0F172A] text-white">
                <Header onShowLanding={() => {}} />
                <div className="flex">
                  <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
                  <main className="flex-1 p-6 ml-64">
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