import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useFinancialData } from '@/context/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const ChatInterface = ({ className, compact = false }) => {
  // Access real data from context
  const { 
    stats, 
    monthlyStats, 
    goals, 
    transactions, 
    spendingLimits 
  } = useFinancialData();

  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Olá! Sou o Monex, seu assistente financeiro inteligente. Analiso seus dados em tempo real para te dar as melhores dicas. Como posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Construct dynamic financial context based on real app data
  // This gives the AI the "eyes" to see the user's financial situation
  const getFinancialContext = () => {
    return {
      saldoTotal: formatCurrency(stats.balance),
      receitaMensal: formatCurrency(monthlyStats.income),
      despesasMensais: formatCurrency(monthlyStats.expenses),
      saldoMensalDisponivel: formatCurrency(monthlyStats.income - monthlyStats.expenses),
      economiaAtual: formatCurrency(stats.balance),
      metas: goals.map(g => ({
        nome: g.name,
        alvo: formatCurrency(g.targetAmount),
        atual: formatCurrency(g.currentAmount),
        progresso: `${Math.round((g.currentAmount / g.targetAmount) * 100)}%`
      })),
      ultimasTransacoes: transactions.slice(0, 5).map(t => ({
        tipo: t.type === 'income' ? 'Receita' : 'Despesa',
        categoria: t.category,
        valor: formatCurrency(t.amount),
        data: t.date,
        descricao: t.description
      })),
      limitesGastos: spendingLimits.map(l => ({
        categoria: l.category,
        limite: formatCurrency(l.limit),
        gasto: formatCurrency(l.spent),
        restante: formatCurrency(l.limit - l.spent),
        periodo: l.period
      }))
    };
  };

  const generateResponse = async (userQuery) => {
    setIsLoading(true);
    
    // Keep conversation history for context within the session
    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.type === 'bot' ? 'assistant' : 'user',
      content: m.text
    }));

    try {
      const currentContext = getFinancialContext();
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('smart-endpoint', {
        body: {
          message: userQuery,
          context: currentContext,
          history: conversationHistory
        }
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw error;
      }

      // Handle different possible response structures from the generic endpoint
      const botReply = data?.reply || data?.message || data?.content || (typeof data === 'string' ? data : "Não consegui gerar uma resposta. Tente novamente.");

      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: botReply }]);
    } catch (error) {
      console.error('Erro no chat:', error);
      
      // Fallback response if the edge function fails or is not deployed yet
      const fallbackResponse = "O serviço de IA está temporariamente indisponível. Verifique se a Edge Function 'smart-endpoint' está implantada corretamente no Supabase.";
      
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: fallbackResponse
      }]);

      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao assistente inteligente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput('');
    generateResponse(query);
  };

  return (
    <div className={`bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden flex flex-col relative shadow-xl ${className || 'h-[600px]'}`}>
      {/* Header */}
      <div className="bg-[#0F172A] border-b border-[#334155] p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-[#14B8A6] to-[#2DD4BF] p-2 rounded-lg shadow-lg shadow-[#14B8A6]/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg flex items-center gap-2">
              Monex AI
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                </span>
                <span className="text-[10px] font-medium text-[#14B8A6] uppercase tracking-wider">Online</span>
              </div>
            </span>
            {!compact && <p className="text-xs text-slate-400 mt-0.5">Seu consultor financeiro pessoal 24h</p>}
          </div>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setMessages([{ id: Date.now(), type: 'bot', text: 'Conversa reiniciada. Como posso ajudar?' }])}
            title="Reiniciar conversa"
        >
            <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-[#1E293B]/50">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="bg-[#0F172A] border border-[#334155] rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot className="h-4 w-4 text-[#14B8A6]" />
              </div>
            )}
            <div
              className={`rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed shadow-md ${
                message.type === 'user'
                  ? 'bg-[#14B8A6] text-white rounded-br-sm'
                  : 'bg-[#334155] text-slate-200 rounded-bl-sm border border-[#475569]'
              }`}
            >
              {message.type === 'bot' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  {message.text.split('\n').map((line, i) => (
                    <p key={i} className={`min-h-[1.2em] ${line.startsWith('-') ? 'pl-2' : ''}`}>
                        {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p>{message.text}</p>
              )}
            </div>
            {message.type === 'user' && (
              <div className="bg-[#475569] rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start items-end"
          >
            <div className="bg-[#0F172A] border border-[#334155] rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-[#14B8A6] animate-pulse" />
            </div>
            <div className="bg-[#334155] rounded-2xl rounded-bl-sm p-4 border border-[#475569]">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0F172A] border-t border-[#334155] shrink-0">
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Pergunte sobre seus gastos, metas ou peça uma dica..."
            disabled={isLoading}
            className="flex-1 bg-[#1E293B] text-white rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent border border-[#334155] placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`absolute right-1.5 top-1.5 h-[calc(100%-12px)] w-10 p-0 rounded-lg transition-all shadow-lg ${
                input.trim() 
                ? 'bg-[#14B8A6] hover:bg-[#0D9488] text-white' 
                : 'bg-[#334155] text-slate-500 hover:bg-[#475569]'
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-600">
                O Monex AI pode cometer erros. Verifique informações importantes.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;