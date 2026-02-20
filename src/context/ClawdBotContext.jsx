/**
 * ClawdBot Context Provider
 * 
 * Contexto centralizado que garante uma única instância do ClawdBot
 * compartilhada entre Header, Dashboard, Chat e qualquer componente.
 * Resolve o problema de instâncias duplicadas do useClawdBot.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useFinancialData } from '@/context/FinancialContext';
import { generateInsights, filterDismissedInsights, getTopInsights } from '@/services/clawdbot/insightEngine';
import { 
  executeNavigationAction, 
  executeConfirmedAction, 
  requiresConfirmation, 
  parseActionFromChat 
} from '@/services/clawdbot/actionExecutor';
import {
  loadNotifications,
  saveNotifications,
  loadDismissedIds,
  dismissInsight,
  markAllAsRead,
  insightsToNotifications,
  countUnread,
  cleanup,
  updateLastCheckTime,
} from '@/services/clawdbot/notificationService';

const ClawdBotContext = createContext(null);

const CHECK_INTERVAL = 5 * 60 * 1000; // Re-analisa a cada 5 minutos

export function ClawdBotProvider({ children, setActiveSection }) {
  const financialData = useFinancialData();
  const {
    transactions,
    monthlyStats,
    goals,
    spendingLimits,
    debts,
    creditCards,
    userProfile,
    // Ações
    addGoal,
    modifyGoal,
    addSpendingLimit,
    updateSpendingLimit,
    payDebt,
    addTransaction,
  } = financialData;

  const [insights, setInsights] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const intervalRef = useRef(null);
  const lastDataHash = useRef('');

  // Ações do FinancialContext que o bot pode executar
  const financialActions = useRef({});
  financialActions.current = {
    addGoal,
    modifyGoal,
    goals,
    addSpendingLimit,
    updateSpendingLimit,
    payDebt,
    addTransaction,
  };

  /**
   * Executa a análise de insights com base nos dados atuais
   */
  const runAnalysis = useCallback(() => {
    const dismissedIds = loadDismissedIds();
    
    const allInsights = generateInsights({
      transactions,
      monthlyStats,
      goals,
      spendingLimits,
      debts,
      creditCards,
      userProfile,
    });

    const filtered = filterDismissedInsights(allInsights, dismissedIds);
    const top = getTopInsights(filtered, 10);
    
    setInsights(top);

    // Atualiza notificações
    const existingNotifs = loadNotifications();
    const updatedNotifs = insightsToNotifications(top, existingNotifs);
    saveNotifications(updatedNotifs);
    setNotifications(updatedNotifs);
    setUnreadCount(countUnread(updatedNotifs));
    
    updateLastCheckTime();
  }, [transactions, monthlyStats, goals, spendingLimits, debts, creditCards, userProfile]);

  // Gera hash dos dados para detectar mudanças
  const getDataHash = useCallback(() => {
    return `${transactions.length}-${monthlyStats.income}-${monthlyStats.expenses}-${goals.length}-${spendingLimits.length}-${debts.length}-${creditCards.length}`;
  }, [transactions, monthlyStats, goals, spendingLimits, debts, creditCards]);

  // Executa análise quando dados mudam
  useEffect(() => {
    const currentHash = getDataHash();
    if (currentHash !== lastDataHash.current) {
      lastDataHash.current = currentHash;
      runAnalysis();
    }
  }, [getDataHash, runAnalysis]);

  // Análise periódica + cleanup na montagem
  useEffect(() => {
    cleanup();
    
    intervalRef.current = setInterval(() => {
      runAnalysis();
    }, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runAnalysis]);

  const handleDismiss = useCallback((insightId) => {
    dismissInsight(insightId);
    setInsights(prev => prev.filter(i => i.id !== insightId));
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== insightId);
      saveNotifications(updated);
      setUnreadCount(countUnread(updated));
      return updated;
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    const updated = markAllAsRead();
    setNotifications(updated);
    setUnreadCount(0);
  }, []);

  const handleInsightAction = useCallback((insight) => {
    if (!insight.actionType) return;

    if (requiresConfirmation(insight.actionType)) {
      setPendingAction({
        type: insight.actionType,
        data: insight.actionData || {},
        title: insight.title,
        description: insight.description,
        actionLabel: insight.actionLabel,
      });
    } else {
      const result = executeNavigationAction(insight.actionType, insight.actionData, setActiveSection);
      if (result.success) {
        setActionResult(result);
        setTimeout(() => setActionResult(null), 3000);
      }
    }
  }, [setActiveSection]);

  const confirmAction = useCallback(async (additionalData = {}) => {
    if (!pendingAction) return;

    const mergedData = { ...pendingAction.data, ...additionalData };
    const result = await executeConfirmedAction(pendingAction.type, mergedData, financialActions.current);
    
    setActionResult(result);
    setPendingAction(null);
    
    setTimeout(() => {
      runAnalysis();
      setActionResult(null);
    }, 3000);

    return result;
  }, [pendingAction, runAnalysis]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const detectChatAction = useCallback((message) => {
    return parseActionFromChat(message);
  }, []);

  const triggerActionFromChat = useCallback((actionType, actionData) => {
    if (requiresConfirmation(actionType)) {
      setPendingAction({
        type: actionType,
        data: actionData || {},
        title: `Ação via Chat: ${actionType}`,
        description: 'Ação detectada na conversa com o ClawdBot',
        actionLabel: 'Confirmar',
      });
    } else {
      executeNavigationAction(actionType, actionData, setActiveSection);
    }
  }, [setActiveSection]);

  const refresh = useCallback(() => {
    lastDataHash.current = '';
    runAnalysis();
  }, [runAnalysis]);

  const value = {
    // Estado
    insights,
    notifications,
    unreadCount,
    pendingAction,
    actionResult,

    // Ações
    handleDismiss,
    handleMarkAllRead,
    handleInsightAction,
    confirmAction,
    cancelAction,
    detectChatAction,
    triggerActionFromChat,
    refresh,
  };

  return (
    <ClawdBotContext.Provider value={value}>
      {children}
    </ClawdBotContext.Provider>
  );
}

export function useClawdBotContext() {
  const context = useContext(ClawdBotContext);
  if (!context) {
    throw new Error('useClawdBotContext must be used within a ClawdBotProvider');
  }
  return context;
}
