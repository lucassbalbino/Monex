import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  Shield,
  Zap,
  Crown,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  getSubscriptionInfo,
  cancelSubscription,
  reactivateSubscription,
  formatPlanInterval,
  formatPlanName,
  formatCurrency,
  formatDate,
  getStatusInfo,
} from '@/services/subscriptionService';

const PLAN_ICONS = {
  mensal: Zap,
  semestral: Shield,
  anual: Crown,
  month: Zap,
  year: Crown,
};

const SubscriptionManager = () => {
  const { toast } = useToast();
  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelStep, setCancelStep] = useState(1); // 1 = motivo, 2 = confirmação final
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState(null);

  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubscriptionInfo();
      setSubInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  // ─── Cancelar ──────────────────────────────────────────────
  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const result = await cancelSubscription();
      
      toast({
        title: 'Cancelamento agendado',
        description: result.currentPeriodEnd
          ? `Sua assinatura ficará ativa até ${formatDate(result.currentPeriodEnd)}`
          : 'Sua assinatura será cancelada ao final do período atual',
        className: 'bg-amber-600 text-white border-none',
        duration: 6000,
      });

      setShowCancelConfirm(false);
      setCancelStep(1);
      setCancelReason('');
      await fetchInfo();
    } catch (err) {
      toast({
        title: 'Erro ao cancelar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Reativar ──────────────────────────────────────────────
  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      await reactivateSubscription();
      
      toast({
        title: 'Assinatura reativada! 🎉',
        description: 'Que bom que você voltou! Sua assinatura está ativa novamente.',
        className: 'bg-green-600 text-white border-none',
        duration: 5000,
      });

      await fetchInfo();
    } catch (err) {
      toast({
        title: 'Erro ao reativar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-[#14B8A6] animate-spin" />
        <p className="text-sm text-gray-400">Carregando informações da assinatura...</p>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <XCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-gray-400 text-center max-w-xs">{error}</p>
        <Button
          onClick={fetchInfo}
          variant="outline"
          size="sm"
          className="text-white border-[#334155] hover:bg-[#334155]"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  const isCanceling = subInfo?.cancelAtPeriodEnd || subInfo?.status === 'canceling';
  const isActive = subInfo?.status === 'active' || subInfo?.status === 'trialing';
  const statusInfo = getStatusInfo(subInfo?.status, subInfo?.cancelAtPeriodEnd);
  const planName = formatPlanName(subInfo?.plan, subInfo?.planInterval);
  const PlanIcon = PLAN_ICONS[planName?.toLowerCase()] || PLAN_ICONS[subInfo?.planInterval] || CreditCard;

  // ─── Tela de confirmação de cancelamento ───────────────────
  if (showCancelConfirm) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`cancel-step-${cancelStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {cancelStep === 1 ? (
            /* Step 1: Motivo do cancelamento */
            <>
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelStep(1); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>

              <div className="text-center space-y-2 py-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Sentiremos sua falta!</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  Antes de prosseguir, poderia nos dizer o motivo? Isso nos ajuda a melhorar.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  'Está muito caro para mim',
                  'Não estou usando o suficiente',
                  'Encontrei outra alternativa',
                  'Faltam funcionalidades que preciso',
                  'Problemas técnicos',
                  'Outro motivo',
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                      cancelReason === reason
                        ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-white'
                        : 'border-[#334155] bg-[#0F172A] text-gray-300 hover:border-[#475569]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setCancelStep(2)}
                disabled={!cancelReason}
                className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                Continuar com cancelamento
              </Button>
            </>
          ) : (
            /* Step 2: Confirmação final */
            <>
              <button
                onClick={() => setCancelStep(1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>

              <div className="text-center space-y-2 py-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Confirmar cancelamento</h3>
              </div>

              {/* O que o usuário vai perder */}
              <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-gray-300">Ao cancelar, você perderá acesso a:</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    Assistente financeiro Monex com IA
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    Rastreamento e análise de gastos
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    Metas financeiras e desafios
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    Alertas inteligentes personalizados
                  </li>
                </ul>
              </div>

              {/* Aviso: acesso até o final do período */}
              {subInfo?.currentPeriodEnd && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-300">
                    <strong>Nota:</strong> Você ainda terá acesso até{' '}
                    <strong>{formatDate(subInfo.currentPeriodEnd)}</strong>.
                    Após essa data, seu acesso será encerrado.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => { setShowCancelConfirm(false); setCancelStep(1); setCancelReason(''); }}
                  variant="outline"
                  className="flex-1 border-[#334155] text-white hover:bg-[#334155]"
                  disabled={actionLoading}
                >
                  Manter assinatura
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar cancelamento'
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Tela principal ────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Status + Plano */}
      <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#0D9488] flex items-center justify-center">
              <PlanIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Plano {planName}</h3>
              {subInfo?.planAmount > 0 && (
                <p className="text-sm text-gray-400">
                  {formatCurrency(subInfo.planAmount)}/{formatPlanInterval(subInfo.planInterval)}
                </p>
              )}
            </div>
          </div>

          {/* Badge de status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${isActive && !isCanceling ? 'animate-pulse' : ''}`} />
            <span className={statusInfo.color}>{statusInfo.label}</span>
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-3">
          {subInfo?.created && (
            <div className="bg-[#1E293B] rounded-lg p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Assinante desde</p>
              <p className="text-sm text-white font-medium">{formatDate(subInfo.created)}</p>
            </div>
          )}
          {subInfo?.currentPeriodEnd && (
            <div className="bg-[#1E293B] rounded-lg p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                {isCanceling ? 'Acesso até' : 'Próxima cobrança'}
              </p>
              <p className={`text-sm font-medium ${isCanceling ? 'text-amber-400' : 'text-white'}`}>
                {formatDate(subInfo.currentPeriodEnd)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Aviso se cancelando */}
      {isCanceling && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4"
        >
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Cancelamento agendado</p>
              <p className="text-xs text-amber-300/70 mt-1">
                Sua assinatura ainda está ativa, mas não será renovada. Você pode reativar a qualquer momento antes do final do período.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ações */}
      <div className="space-y-2 pt-1">
        {isCanceling ? (
          /* Opção de reativação */
          <Button
            onClick={handleReactivate}
            disabled={actionLoading}
            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-medium"
          >
            {actionLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reativando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reativar minha assinatura
              </>
            )}
          </Button>
        ) : isActive ? (
          /* Opção de cancelamento */
          <Button
            onClick={() => setShowCancelConfirm(true)}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
          >
            Cancelar assinatura
          </Button>
        ) : null}
      </div>

      {/* Info legal */}
      <p className="text-[11px] text-gray-600 text-center leading-relaxed pt-2">
        O cancelamento é efetivado ao final do período pago. Não há reembolso proporcional.
        Em caso de dúvidas, entre em contato: <span className="text-gray-500">suporte@monex.com</span>
      </p>
    </div>
  );
};

export default SubscriptionManager;
