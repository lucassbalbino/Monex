import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';

/**
 * Serviço de gerenciamento de assinatura Stripe
 * Comunica com a Edge Function `cancel-subscription` do Supabase
 * 
 * EDGE_FUNCTION_READY: mude para true depois de deployar a Edge Function:
 *   supabase functions deploy cancel-subscription
 */
const EDGE_FUNCTION_READY = true;

// URL base da Edge Function
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`;

/**
 * Chama a Edge Function diretamente via fetch().
 * Usa token fresco + apikey como headers.
 * Evita problemas de JWT do supabase.functions.invoke().
 */
async function callEdgeFunction(body) {
  // 1. Refresh forçado para obter token válido
  const { data: refreshData } = await supabase.auth.refreshSession();
  let accessToken = refreshData?.session?.access_token;

  // 2. Fallback: sessão existente
  if (!accessToken) {
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;
  }

  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // 3. Fetch direto (sem SDK) — controle total dos headers
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status}`);
  }

  return data;
}

// ─── Buscar detalhes da assinatura ────────────────────────────
export async function getSubscriptionInfo() {
  // Se a Edge Function não está deployada, usar dados locais diretamente
  if (!EDGE_FUNCTION_READY) {
    return await getLocalSubscriptionInfo();
  }

  try {
    const data = await callEdgeFunction({ action: 'info' });
    return data;
  } catch (err) {
    logger.warn('Edge Function indisponível, usando fallback local:', err.message);
    return await getLocalSubscriptionInfo();
  }
}

/**
 * Fallback: busca info básica direto do perfil Supabase
 * (quando a Edge Function não está deployada)
 */
async function getLocalSubscriptionInfo() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: 'inactive', plan: null, cancelAtPeriodEnd: false, currentPeriodEnd: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, current_plan, cancel_at_period_end, stripe_subscription_id, created_at')
      .eq('id', user.id)
      .single();

    return {
      status: profile?.subscription_status || 'inactive',
      plan: profile?.current_plan || null,
      planAmount: 0,
      planInterval: '',
      cancelAtPeriodEnd: profile?.cancel_at_period_end || false,
      currentPeriodEnd: null,
      created: profile?.created_at || null,
      _fallback: true, // indica que é dados locais
    };
  } catch {
    return { status: 'inactive', plan: null, cancelAtPeriodEnd: false, currentPeriodEnd: null, _fallback: true };
  }
}

// ─── Cancelar assinatura (ao final do período) ───────────────
export async function cancelSubscription() {
  if (!EDGE_FUNCTION_READY) {
    throw new Error('Sistema de cancelamento em configuração. Entre em contato com suporte@monex.com para cancelar sua assinatura.');
  }

  try {
    const data = await callEdgeFunction({ action: 'cancel' });

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    logger.error('cancelSubscription error:', err);
    throw err;
  }
}

// ─── Reativar assinatura (remover cancelamento pendente) ─────
export async function reactivateSubscription() {
  if (!EDGE_FUNCTION_READY) {
    throw new Error('Sistema de reativação em configuração. Entre em contato com suporte@monex.com para reativar sua assinatura.');
  }

  try {
    const data = await callEdgeFunction({ action: 'reactivate' });

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    logger.error('reactivateSubscription error:', err);
    throw err;
  }
}

// ─── Helpers ──────────────────────────────────────────────────

/** Formata o intervalo do plano para português */
export function formatPlanInterval(interval) {
  const map = {
    month: 'mês',
    year: 'ano',
    week: 'semana',
    day: 'dia',
  };
  return map[interval] || interval;
}

/** Formata o nome do plano para exibição */
export function formatPlanName(planName, interval) {
  if (planName) return planName;
  
  const intervalNames = {
    month: 'Mensal',
    year: 'Anual',
    week: 'Semanal',
    day: 'Diário',
  };
  return intervalNames[interval] || 'Premium';
}

/** Formata valor em reais */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/** Formata data para exibição */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Retorna info amigável do status */
export function getStatusInfo(status, cancelAtPeriodEnd) {
  if (cancelAtPeriodEnd || status === 'canceling') {
    return {
      label: 'Cancelamento Agendado',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      dotColor: 'bg-amber-400',
    };
  }

  const statusMap = {
    active: {
      label: 'Ativa',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      dotColor: 'bg-green-400',
    },
    trialing: {
      label: 'Período de Teste',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      dotColor: 'bg-blue-400',
    },
    past_due: {
      label: 'Pagamento Pendente',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      dotColor: 'bg-red-400',
    },
    canceled: {
      label: 'Cancelada',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      dotColor: 'bg-gray-400',
    },
    inactive: {
      label: 'Inativa',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      dotColor: 'bg-gray-400',
    },
  };

  return statusMap[status] || statusMap.inactive;
}
