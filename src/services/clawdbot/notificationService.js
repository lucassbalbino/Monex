/**
 * Monex Notification Service
 * 
 * Gerencia notificações proativas do Monex.
 * Persiste no localStorage quais insights foram vistos/descartados.
 */

import { logger } from '@/lib/logger';

const STORAGE_KEY = 'clawdbot_notifications';
const DISMISSED_KEY = 'clawdbot_dismissed';
const LAST_CHECK_KEY = 'clawdbot_last_check';

/**
 * Carrega notificações salvas do localStorage
 */
export function loadNotifications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Salva notificações no localStorage
 */
export function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    logger.error('Erro ao salvar notificações Monex:', e);
  }
}

/**
 * Carrega IDs de insights descartados
 */
export function loadDismissedIds() {
  try {
    const saved = localStorage.getItem(DISMISSED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Descarta um insight (o usuário não quer vê-lo novamente)
 */
export function dismissInsight(insightId) {
  const dismissed = loadDismissedIds();
  if (!dismissed.includes(insightId)) {
    dismissed.push(insightId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
  return dismissed;
}

/**
 * Marca todas as notificações como lidas
 */
export function markAllAsRead() {
  const notifications = loadNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
}

/**
 * Retorna o timestamp do último check
 */
export function getLastCheckTime() {
  try {
    const saved = localStorage.getItem(LAST_CHECK_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Atualiza o timestamp do último check
 */
export function updateLastCheckTime() {
  localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
}

/**
 * Converte insights em notificações com metadados adicionais
 */
export function insightsToNotifications(insights, existingNotifications = []) {
  const existingMap = new Map(existingNotifications.map(n => [n.id, n]));
  const freshInsightIds = new Set(insights.map(i => i.id));
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  // Processa cada insight: atualiza texto se já existe, ou cria nova notificação
  const fromInsights = insights.map(insight => {
    const existing = existingMap.get(insight.id);
    if (existing) {
      // Atualiza título/descrição/dados com valores frescos, preserva read + createdAt
      return {
        ...existing,
        title: insight.title,
        description: insight.description,
        actionData: insight.actionData,
        actionLabel: insight.actionLabel,
        actionType: insight.actionType,
        icon: insight.icon,
        type: insight.type,
      };
    }
    // Notificação nova
    return { ...insight, read: false, createdAt: Date.now() };
  });

  // Mantém notificações existentes que NÃO têm mais um insight correspondente
  // (ex: insight foi descartado mas a notificação lida ainda é válida)
  // Remove notificações antigas (mais de 7 dias)
  const orphanNotifications = existingNotifications.filter(
    n => !freshInsightIds.has(n.id) && n.createdAt > sevenDaysAgo
  );

  return [...fromInsights, ...orphanNotifications];
}

/**
 * Conta notificações não lidas
 */
export function countUnread(notifications) {
  return notifications.filter(n => !n.read).length;
}

/**
 * Limpa notificações antigas e IDs descartados expirados
 */
export function cleanup() {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  // Limpa notificações antigas
  const notifications = loadNotifications().filter(n => n.createdAt > sevenDaysAgo);
  saveNotifications(notifications);

  // Limpa dismissed IDs (reseta a cada 30 dias para re-avaliar insights)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const lastCleanup = parseInt(localStorage.getItem('clawdbot_last_cleanup') || '0', 10);
  if (lastCleanup < thirtyDaysAgo) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([]));
    localStorage.setItem('clawdbot_last_cleanup', Date.now().toString());
  }
}
