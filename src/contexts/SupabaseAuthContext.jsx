import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [profileRole, setProfileRole] = useState(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  const initRef = useRef(false);
  const currentUserIdRef = useRef(null);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, role')
        .eq('id', userId)
        .single();

      setSubscriptionStatus(profile?.subscription_status ?? null);
      setProfileRole(profile?.role ?? null);
      setSubscriptionChecked(true);
    } catch {
      setSubscriptionChecked(true);
    }
  }, []);

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
          currentUserIdRef.current = currentSession.user.id;
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setSubscriptionChecked(true);
        }
      } catch {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;

      if (event === 'PASSWORD_RECOVERY') {
        currentUserIdRef.current = newSession?.user?.id ?? null;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        return;
      }

      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setSubscriptionStatus(null);
        setProfileRole(null);
        setSubscriptionChecked(false);
      } else if (event === 'SIGNED_IN' && newSession?.user?.id) {
        if (currentUserIdRef.current === newSession.user.id) {
          setSession(newSession);
          setUser(newSession.user);
          return;
        }
        currentUserIdRef.current = newSession.user.id;
        setSession(newSession);
        setUser(newSession.user);
        setSubscriptionChecked(false);
        fetchProfile(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...options,
        emailRedirectTo: options?.emailRedirectTo || 'https://monexapp.com.br/confirm-email',
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no cadastro",
        description: error.message || "Algo deu errado",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no login",
        description: error.message || "Algo deu errado",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha ao sair",
        description: error.message || "Algo deu errado",
      });
    }

    return { error };
  }, [toast]);

  const sendPasswordReset = useCallback(async (email) => {
    try {
      const redirectTo = 'https://monexapp.com.br/reset-password';
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        toast({
          variant: "destructive",
          title: "Falha ao enviar email",
          description: error.message || "Não foi possível enviar o email de recuperação.",
        });
        return { error };
      }

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para instruções de recuperação.",
        className: "bg-green-600 text-white border-none",
      });

      return { data };
    } catch (err) {
      logger.error('Password reset error:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Ocorreu um erro.",
      });
      return { error: err };
    }
  }, [toast]);

  const userId = user?.id ?? null;

  const value = useMemo(() => ({
    user,
    userId,
    session,
    loading,
    subscriptionStatus,
    profileRole,
    subscriptionChecked,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
  }), [user, userId, session, loading, subscriptionStatus, profileRole, subscriptionChecked, signUp, signIn, signOut, sendPasswordReset]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};