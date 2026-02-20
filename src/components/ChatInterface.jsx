import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useFinancialData } from '@/context/FinancialContext';
import { useClawdBotContext } from '@/context/ClawdBotContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';
import { securityUtils } from '@/lib/security';

const ChatInterface = ({ className, compact = false }) => {
  // Access real data from context
  const { 
    stats, 
    monthlyStats, 
    goals, 
    transactions, 
    spendingLimits,
    userProfile
  } = useFinancialData();

  // ClawdBot — contexto centralizado para detecção de ações no chat
  const { detectChatAction, triggerActionFromChat } = useClawdBotContext();

  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Olá! Sou o ClawdBot, seu assistente financeiro inteligente. Analiso seus dados em tempo real para te dar as melhores dicas. Posso também executar ações como criar metas, registrar transações e muito mais. Como posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const activeRequestIdRef = useRef(0);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const storageKey = userId ? `chatMessages_${userId}` : 'chatMessages';

  // Get user ID for per-user persistence
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUserId(data?.session?.user?.id || null);
      } catch (error) {
        logger.error('Error getting user session:', error);
        setUserId(null);
      }
    };
    getUser();
  }, []);

  // Load messages from localStorage on mount or userId change
  useEffect(() => {
    if (userId !== null) {
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (error) {
          logger.error('Error parsing saved messages:', error);
          // Fallback to default
        }
      }
    }
  }, [userId, storageKey]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (userId !== null && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, userId, storageKey]);

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
      usuario: userProfile ? {
        nome: userProfile.name,
        assinatura: userProfile.isSubscribed,
        // outros campos relevantes
      } : null,
      saldoTotal: stats.balance,
      saldoTotalFormatado: formatCurrency(stats.balance),
      receitaMensal: monthlyStats.income,
      despesasMensais: monthlyStats.expenses,
      saldoMensalDisponivel: monthlyStats.income - monthlyStats.expenses,
      metas: goals.map(g => ({
        id: g.id,
        nome: g.name,
        alvo: g.targetAmount,
        alvoFormatado: formatCurrency(g.targetAmount),
        atual: g.currentAmount,
        progresso: g.targetAmount ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        categoria: g.category
      })),
      ultimasTransacoes: transactions.slice(0, 5).map(t => ({
        id: t.id,
        tipo: t.type,
        categoria: t.category,
        valor: t.amount,
        valorFormatado: formatCurrency(t.amount),
        data: t.date,
        descricao: t.description
      })),
      limitesGastos: spendingLimits.map(l => ({
        id: l.id,
        categoria: l.category,
        limite: l.limit,
        limiteFormatado: formatCurrency(l.limit),
        gasto: l.spent,
        gastoFormatado: formatCurrency(l.spent),
        restante: l.limit - l.spent,
        restanteFormatado: formatCurrency(l.limit - l.spent),
        periodo: l.period
      })),
      alertas: [], // Array vazio por enquanto, pode implementar depois
      dataAtual: new Date().toISOString().split('T')[0],
      clawdbot: {
        capabilities: [
          'criar_meta', 'ajustar_limite', 'registrar_transacao',
          'pagar_divida', 'analisar_gastos', 'sugerir_economia'
        ],
        instructions: 'Você é o ClawdBot, assistente financeiro proativo do Monex. Quando o usuário pedir para executar uma ação (criar meta, registrar gasto, etc.), responda confirmando a ação e os dados. Seja proativo em sugerir melhorias financeiras.'
      }
    };
  };

  const generateResponse = async (userQuery) => {
    const requestId = Date.now();
    activeRequestIdRef.current = requestId;
    setIsLoading(true);
    // Keep conversation history for context within the session
    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.type === 'bot' ? 'assistant' : 'user',
      content: m.text
    }));

    let fallbackUsed = false;
    try {
      const currentContext = getFinancialContext();
      logger.secure('Enviando contexto para IA');
      let headers;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || sessionData?.access_token || null;
        if (accessToken) headers = { Authorization: `Bearer ${accessToken}` };
      } catch (e) {
        // ignore if auth not available
      }

      const invokePromise = supabase.functions.invoke('smart-endpoint', {
        body: {
          message: userQuery,
          context: currentContext,
          history: conversationHistory
        },
        headers
      });
      const timeoutMs = 35000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite ao consultar o assistente. Tente novamente.')), timeoutMs);
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
      if (error) {
        logger.error('[MonexAI] Supabase Function Error:', error);
        fallbackUsed = true;
        throw error;
      }
      logger.info('Resposta recebida da IA', { replyLength: data?.reply?.length || 0 });
      const botReply = data?.reply || data?.message || data?.content || (typeof data === 'string' ? data : "Não consegui gerar uma resposta. Tente novamente.");
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: botReply }]);
    } catch (error) {
      logger.error('Erro no chat:', error);
      const fallbackResponse = "O serviço de IA está temporariamente indisponível. Verifique se a Edge Function 'smart-endpoint' está implantada corretamente no Supabase.";
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: fallbackResponse + (error?.message ? `\n[Erro: ${error.message}]` : '')
      }]);
      toast({
        title: "Erro de Conexão",
        description: error?.message ? error.message : "Não foi possível conectar ao assistente inteligente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = 0;
      }
    }
  };

  const handleSend = () => {
    if (isLoading) return;
    if (!input.trim()) return;

    // Security validation
    if (securityUtils.containsSuspiciousPatterns(input)) {
      toast({
        title: "Conteúdo suspeito detectado",
        description: "Por favor, evite usar scripts ou conteúdo malicioso.",
        variant: "destructive"
      });
      return;
    }

    const sanitizedInput = securityUtils.sanitizeInput(input);
    if (sanitizedInput !== input) {
      logger.warn('Input sanitized', { originalLength: input.length, sanitizedLength: sanitizedInput.length });
    }

    const userMessage = { id: Date.now(), type: 'user', text: sanitizedInput };
    setMessages(prev => [...prev, userMessage]);
    const query = sanitizedInput;
    setInput('');

    // Detecta se o usuário quer executar uma ação (criar meta, pagar dívida, etc.)
    const actionDetection = detectChatAction(query);
    if (actionDetection.detected) {
      triggerActionFromChat(actionDetection.action, {});
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: `Detectei que você quer executar uma ação. Abri o formulário de confirmação para você preencher os dados. Enquanto isso, vou consultar minha base para te dar mais contexto...`
      }]);
    }

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
              ClawdBot
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                </span>
                <span className="text-[10px] font-medium text-[#14B8A6] uppercase tracking-wider">Online</span>
              </div>
            </span>
            {!compact && <p className="text-xs text-slate-400 mt-0.5">Seu consultor financeiro pessoal com IA</p>}
          </div>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => {
              setMessages([{ id: Date.now(), type: 'bot', text: 'Conversa reiniciada. Como posso ajudar?' }]);
              if (userId !== null) {
                localStorage.removeItem(storageKey);
              }
            }}
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
            placeholder="Pergunte, peça uma meta, registre um gasto..."
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
                ClawdBot pode executar ações e cometer erros. Verifique informações importantes.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;