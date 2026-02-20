// Monex - Motor de Gestão Financeira Proativa
// Re-exporta todos os módulos do Monex para fácil importação

export { generateInsights, filterDismissedInsights, getTopInsights, INSIGHT_TYPES, INSIGHT_PRIORITIES } from './insightEngine';
export { executeNavigationAction, executeConfirmedAction, requiresConfirmation, parseActionFromChat, CLAWDBOT_ACTIONS } from './actionExecutor';
export { 
  loadNotifications, 
  saveNotifications, 
  loadDismissedIds, 
  dismissInsight, 
  markAllAsRead, 
  insightsToNotifications, 
  countUnread, 
  cleanup 
} from './notificationService';
