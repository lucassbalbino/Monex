import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Lightbulb, 
  FileText, 
  Heart, 
  TrendingUp, 
  LifeBuoy, 
  Trophy,
  Wallet,
  LogOut,
  CreditCard,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    // Removed "Ver Planos" from sidebar as requested
    { id: 'challenges', label: 'Desafios', icon: Trophy },
    { id: 'credit-cards', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'tracking', label: 'Rastreamento', icon: Receipt },
    { id: 'spending-limits', label: 'Limites', icon: Target },
    { id: 'conscious-spending', label: 'Gastos Conscientes', icon: Lightbulb },
    { id: 'summaries', label: 'Resumos', icon: FileText },
    { id: 'progress', label: 'Progresso', icon: TrendingUp },
    { id: 'debt-tips', label: 'Dívidas', icon: LifeBuoy },
    { 
      id: 'emotional-progress', 
      label: 'Progresso Emocional', 
      icon: Heart,
      status: 'dev' 
    },
  ];

  const handleNavigation = (item) => {
    if (item.isLink) {
      navigate('/landing');
    } else {
      setActiveSection(item.id);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#1E293B] border-r border-[#334155] flex flex-col z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-[#334155]">
        <div className="flex items-center gap-2">
           <img 
            src="https://horizons-cdn.hostinger.com/26fb3ff4-2941-4291-a8b9-2757b63ade4c/4d34c56b0a0a4f437b2e1b698d3b5297.jpg" 
            alt="Logo Monex" 
            className="h-8 w-auto"
          />
          <span className="text-2xl font-bold text-white tracking-tight">Monex</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-1">Seu Assistente Financeiro</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isDev = item.status === 'dev';
          const isLink = item.isLink;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20' 
                  : 'text-gray-400 hover:bg-[#334155] hover:text-white'
              } ${isDev && !isActive ? 'opacity-70' : ''}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : (isLink ? 'text-[#14B8A6]' : (isDev ? 'text-gray-500' : 'text-gray-400 group-hover:text-white'))}`} />
              <span className={`font-medium text-sm text-left flex-1 ${isLink ? 'text-[#14B8A6]' : ''}`}>{item.label}</span>
              
              {/* Optional Badges */}
              {isDev && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  isActive 
                    ? 'bg-white/20 border-white/30 text-white' 
                    : 'bg-[#0F172A] border-[#475569] text-gray-500'
                }`}>
                  DEV
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile Stub - HIDDEN as per request */}
      {/* 
      <div className="p-4 border-t border-[#334155]">
        <div className="bg-[#0F172A] rounded-lg p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#14B8A6] to-blue-500 flex items-center justify-center text-xs font-bold text-white">
            US
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Usuário</p>
            <p className="text-xs text-gray-500 truncate">Free Plan</p>
          </div>
          <LogOut className="h-4 w-4 text-gray-500 hover:text-red-400 cursor-pointer transition-colors" />
        </div>
      </div> 
      */}
    </div>
  );
};

export default Sidebar;