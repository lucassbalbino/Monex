
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  index,
  enableToggle,
  viewMode,
  onToggle
}) => {
  // If value is a string (already formatted or just text like percentage), keep it. 
  // If it's a number, format it.
  const displayValue = typeof value === 'number' 
    ? formatCurrency(value) 
    : (value || 'R$ 0,00');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] hover:border-[#14B8A6] transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-[#334155] rounded-lg p-3 z-10">
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        
        {enableToggle ? (
          <div className="flex bg-[#0F172A] rounded-lg p-0.5 border border-[#334155] z-10">
            <button
              onClick={() => onToggle('monthly')}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                viewMode === 'monthly' 
                  ? 'bg-[#334155] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => onToggle('annual')}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                viewMode === 'annual' 
                  ? 'bg-[#334155] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-orange-500'} z-10`}>
            {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>

      <div className="z-10 relative">
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{displayValue}</p>
        {enableToggle && (
          <p className={`text-xs mt-1 ${trend === 'up' ? 'text-green-500' : 'text-orange-500'} flex items-center gap-1`}>
             {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
             {change}
          </p>
        )}
      </div>
      
      {/* Decorative gradient blob */}
      <div 
        className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ backgroundColor: color }}
      ></div>
    </motion.div>
  );
};

export default StatsCard;
