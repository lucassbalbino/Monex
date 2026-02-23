import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, TrendingUp, Target, Trophy, Sparkles, 
  Lightbulb, PieChart, Clock, CreditCard, Calendar, 
  TrendingDown, AlertOctagon, Repeat, X, ChevronRight,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INSIGHT_TYPES } from '@/services/clawdbot/insightEngine';

const ICON_MAP = {
  AlertTriangle, TrendingUp, Target, Trophy, Sparkles,
  Lightbulb, PieChart, Clock, CreditCard, Calendar,
  TrendingDown, AlertOctagon, Repeat,
};

const TYPE_STYLES = {
  [INSIGHT_TYPES.ALERT]: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300',
    badgeLabel: 'Urgente',
  },
  [INSIGHT_TYPES.WARNING]: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    badgeLabel: 'Atenção',
  },
  [INSIGHT_TYPES.TIP]: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
    badgeLabel: 'Dica',
  },
  [INSIGHT_TYPES.ACHIEVEMENT]: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
    badgeLabel: 'Conquista',
  },
  [INSIGHT_TYPES.ANALYSIS]: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
    badgeLabel: 'Análise',
  },
};

const InsightCard = React.forwardRef(({ insight, onAction, onDismiss }, ref) => {
  const style = TYPE_STYLES[insight.type] || TYPE_STYLES[INSIGHT_TYPES.ANALYSIS];
  const IconComponent = ICON_MAP[insight.icon] || Sparkles;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl border ${style.border} ${style.bg} p-4 group`}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-white/5"
        title="Dispensar"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${style.iconBg} p-2 rounded-lg shrink-0`}>
          <IconComponent className={`h-4 w-4 ${style.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.badge}`}>
              {style.badgeLabel}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white leading-snug mb-1">
            {insight.title}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {insight.description}
          </p>

          {/* Action button */}
          {insight.actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(insight)}
              className="mt-2 h-7 px-3 text-xs font-medium text-[#14B8A6] hover:text-white hover:bg-[#14B8A6]/20 gap-1"
            >
              {insight.actionLabel}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
InsightCard.displayName = 'InsightCard';

const ProactiveInsights = ({ insights = [], onAction, onDismiss, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="bg-gradient-to-tr from-[#14B8A6] to-[#2DD4BF] p-1.5 rounded-lg shadow-lg shadow-[#14B8A6]/20">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Monex Insights
            {insights.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
              </span>
            )}
          </h3>
          <p className="text-[11px] text-gray-500">Análise proativa das suas finanças</p>
        </div>
      </div>

      {/* Empty state */}
      {insights.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
        >
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Trophy className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-300">Tudo em dia!</h4>
            <p className="text-xs text-gray-400">Suas finanças estão organizadas. Continue assim! 🎉</p>
          </div>
        </motion.div>
      ) : (
        /* Insight Cards */
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {insights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAction={onAction}
                onDismiss={onDismiss}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ProactiveInsights;
