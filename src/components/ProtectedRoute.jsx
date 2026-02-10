// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute - Usado para proteger rotas que requerem autenticação
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a ser renderizado
 * @param {Object|null} props.session - Sessão do usuário (do App.jsx)
 * @param {boolean} props.hasActiveSubscription - Se o usuário tem assinatura ativa
 * @param {boolean} props.loading - Se está carregando a sessão
 */
export default function ProtectedRoute({ children, session, hasActiveSubscription, loading }) {
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#14B8A6] animate-spin" />
      </div>
    );
  }
  
  if (!session) return <Navigate to="/landing" replace />;

  if (!hasActiveSubscription) return <Navigate to="/payment" replace />;
  
  return children;
}