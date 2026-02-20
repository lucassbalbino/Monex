import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, CheckCheck, 
  AlertTriangle, TrendingUp, Target, Trophy, Sparkles,
  Lightbulb, PieChart, Clock, CreditCard, Calendar,
  TrendingDown, AlertOctagon, Repeat, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INSIGHT_TYPES } from '@/services/clawdbot/insightEngine';

const ICON_MAP = {
  AlertTriangle, TrendingUp, Target, Trophy, Sparkles,
  Lightbulb, PieChart, Clock, CreditCard, Calendar,
  TrendingDown, AlertOctagon, Repeat,
};

const TYPE_COLORS = {
  [INSIGHT_TYPES.ALERT]: 'text-red-400',
  [INSIGHT_TYPES.WARNING]: 'text-amber-400',
  [INSIGHT_TYPES.TIP]: 'text-blue-400',
  [INSIGHT_TYPES.ACHIEVEMENT]: 'text-emerald-400',
  [INSIGHT_TYPES.ANALYSIS]: 'text-purple-400',
};

const TYPE_BORDERS = {
  [INSIGHT_TYPES.ALERT]: 'border-l-red-500',
  [INSIGHT_TYPES.WARNING]: 'border-l-amber-500',
  [INSIGHT_TYPES.TIP]: 'border-l-blue-500',
  [INSIGHT_TYPES.ACHIEVEMENT]: 'border-l-emerald-500',
  [INSIGHT_TYPES.ANALYSIS]: 'border-l-purple-500',
};

const NotificationBell = ({ 
  notifications = [], 
  unreadCount = 0, 
  onMarkAllRead, 
  onAction, 
  onDismiss 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleAction = (notification) => {
    onAction?.(notification);
    setIsOpen(false);
  };

  const displayNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="hover:bg-[#334155] transition-colors relative group"
        title="ClawdBot Insights"
      >
        <Bot className="h-5 w-5 text-gray-300 group-hover:text-[#14B8A6] transition-colors" />
        
        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-[#14B8A6] rounded-full flex items-center justify-center shadow-lg shadow-[#14B8A6]/30"
            >
              <span className="text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-[#14B8A6] to-[#2DD4BF] p-1.5 rounded-lg">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">ClawdBot</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-[#14B8A6]/20 text-[#14B8A6] px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount} {unreadCount === 1 ? 'novo' : 'novos'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { onMarkAllRead?.(); }}
                    className="h-7 px-2 text-[10px] text-gray-400 hover:text-white hover:bg-[#334155] gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Marcar lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 text-gray-500 hover:text-white hover:bg-[#334155]"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bot className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum insight no momento</p>
                  <p className="text-xs text-gray-600 mt-1">O ClawdBot está analisando suas finanças...</p>
                </div>
              ) : (
                <div className="py-1">
                  {displayNotifications.map((notification, index) => {
                    const IconComponent = ICON_MAP[notification.icon] || Sparkles;
                    const colorClass = TYPE_COLORS[notification.type] || 'text-gray-400';
                    const borderClass = TYPE_BORDERS[notification.type] || 'border-l-gray-500';

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`px-4 py-3 hover:bg-[#334155]/50 cursor-pointer transition-colors border-l-2 ${borderClass} group ${
                          !notification.read ? 'bg-[#14B8A6]/5' : ''
                        }`}
                        onClick={() => handleAction(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 mt-0.5 ${colorClass}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium truncate ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                          </div>
                          {notification.actionLabel && (
                            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-[#14B8A6] transition-colors shrink-0 mt-0.5" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss?.(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-300 shrink-0 p-0.5 rounded hover:bg-white/5"
                            title="Dispensar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {displayNotifications.length > 0 && (
              <div className="px-4 py-2 border-t border-[#334155] bg-[#0F172A]/50">
                <p className="text-[10px] text-gray-600 text-center">
                  ClawdBot analisa suas finanças continuamente
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
