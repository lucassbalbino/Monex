// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/Auth';

export default function ProtectedRoute({ children, hasActiveSubscription }) {
  const { loading, session } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!session) return <Navigate to="/heropage" replace />;

  if (!hasActiveSubscription) return <Navigate to="/payment" replace />;
  
  return children;
}