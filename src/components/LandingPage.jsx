
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Lock, 
  BarChart3, 
  Wallet,
  Target,
  Calculator,
  Clock,
  Smile,
  Menu,
  X,
  CreditCard,
  PieChart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleSubscribe = (plan = null) => {
    // Default to Monthly plan with specific Price ID if none selected
    const selected = plan || { 
      id: 'price_1SmFKb1SX0uvm0LeBdMYktdz', 
      name: 'Mensal', 
      price: 34.90, 
      interval: 'mês' 
    };
    
    // Store in session storage as backup
    sessionStorage.setItem('monex_selected_plan', JSON.stringify(selected));

    // Navigate to register with plan state
    navigate('/register', { 
        state: { plan: selected } 
    });
  };

  // --- Mock Components for Hero Section ---
  const ConsciousCalculatorMock = () => (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] h-full flex flex-col overflow-hidden shadow-lg">
      <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-purple-400" />
          <span className="font-bold text-white text-sm">Calculadora Consciente</span>
        </div>
      </div>
      <div className="p-5 space-y-4 flex-1">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-bold">Item Desejado</label>
            <div className="bg-[#0F172A] p-2.5 rounded border border-[#334155] text-white text-sm mt-1">
              iPhone 15 Pro
            </div>
          </div>
          <div>
             <label className="text-[10px] text-gray-400 uppercase font-bold">Preço</label>
             <div className="bg-[#0F172A] p-2.5 rounded border border-[#334155] text-white text-sm mt-1 flex justify-between">
               <span>R$ 7.299,00</span>
             </div>
          </div>
        </div>
        
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 mt-2">
          <div className="flex items-center gap-2 mb-1 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-bold text-sm">Atenção</span>
          </div>
          <p className="text-xs text-gray-300 leading-snug">
            Isso compromete <strong>45%</strong> da sua reserva. Recomendamos esperar 3 meses.
          </p>
        </div>
      </div>
    </div>
  );

  const CreditCardMock = () => (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] h-full flex flex-col overflow-hidden shadow-lg">
      <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-white text-sm">Cartões</span>
        </div>
        <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Vence em 3 dias</span>
      </div>
      
      <div className="p-5 flex flex-col gap-4">
        <div className="bg-gradient-to-br from-[#820AD1] to-[#450570] p-4 rounded-xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-5 -mt-5 blur-xl"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-bold text-sm">Nubank</span>
            <span className="text-xs opacity-80">Roxinho</span>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-xs opacity-70">•••• 3421</div>
            <div className="text-right">
              <div className="text-[10px] opacity-70 uppercase">Fatura Atual</div>
              <div className="font-bold text-lg">R$ 1.250,40</div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Limite Utilizado</span>
            <span className="text-white">65%</span>
          </div>
          <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
             <span>Disponível: R$ 850,00</span>
             <span>Total: R$ 2.100,00</span>
          </div>
        </div>
      </div>
    </div>
  );

  const DebtManagerMock = () => (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] h-full flex flex-col overflow-hidden shadow-lg">
      <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-red-400" />
          <span className="font-bold text-white text-sm">Gestão de Dívidas</span>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="bg-[#0F172A] p-3 rounded-lg border border-[#334155]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white">Empréstimo Pessoal</span>
            <span className="text-xs font-bold text-red-400">- R$ 12.400</span>
          </div>
          
          <div className="h-2 bg-[#334155] rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 w-[30%]"></div>
          </div>

          <div className="flex items-center justify-between p-2 bg-purple-500/10 border border-purple-500/20 rounded">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-purple-400" />
              <span className="text-xs text-purple-200">Plano Agressivo</span>
            </div>
            <span className="text-xs font-bold text-white">12x R$ 1.100</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span>Economia projetada: <strong>R$ 2.300</strong> em juros</span>
        </div>
      </div>
    </div>
  );

  const ReportMock = () => (
    <div className="bg-[#1E293B] rounded-xl border border-[#334155] h-full flex flex-col overflow-hidden shadow-lg">
      <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Resumo Mensal</span>
        </div>
        <span className="text-xs text-gray-400">Outubro</span>
      </div>
      
      <div className="p-5 flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
           <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 11.5 4.9" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="60, 100" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 -11.5 4.9" fill="none" stroke="#EF4444" strokeWidth="3" strokeDasharray="30, 100" className="opacity-80" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-400">Saldo</span>
            <span className="text-xs font-bold text-white">+2.1k</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
           <div className="flex justify-between items-center bg-[#0F172A] p-1.5 px-2 rounded border border-[#334155]">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-xs text-gray-300">Receita</span>
             </div>
             <span className="text-xs font-bold text-white">R$ 5.240</span>
           </div>
           
           <div className="flex justify-between items-center bg-[#0F172A] p-1.5 px-2 rounded border border-[#334155]">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span className="text-xs text-gray-300">Despesa</span>
             </div>
             <span className="text-xs font-bold text-white">R$ 3.100</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white overflow-x-hidden font-sans selection:bg-[#14B8A6] selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-[#14B8A6] p-1.5 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Monex</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('benefits')} className="text-sm text-gray-300 hover:text-white transition-colors">Benefícios</button>
              <button onClick={() => scrollToSection('features')} className="text-sm text-gray-300 hover:text-white transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-sm text-gray-300 hover:text-white transition-colors">Depoimentos</button>
              <button onClick={() => scrollToSection('plans')} className="text-sm text-gray-300 hover:text-white transition-colors">Planos</button>
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-white hover:text-[#14B8A6] hover:bg-[#14B8A6]/10">Entrar</Button>
              <Button onClick={() => handleSubscribe(null)} className="bg-[#14B8A6] hover:bg-[#0D9488] text-white">Começar Agora</Button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-[#0F172A] border-b border-[#1E293B]">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <button onClick={() => scrollToSection('benefits')} className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-[#1E293B] rounded-md">Benefícios</button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-[#1E293B] rounded-md">Funcionalidades</button>
              <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-[#1E293B] rounded-md">Depoimentos</button>
              <button onClick={() => navigate('/login')} className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-[#1E293B] rounded-md">Entrar</button>
              <div className="pt-2">
                <Button onClick={() => handleSubscribe(null)} className="w-full bg-[#14B8A6] hover:bg-[#0D9488]">Começar Agora</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-visible">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-[#14B8A6]/10 to-transparent blur-3xl -z-10 pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl space-y-8 relative z-10"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white">
            Transforme sua vida financeira <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF]">a partir de hoje</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Organize, controle e decida com inteligência — em poucos minutos por dia.
            Chega de planilhas complicadas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              onClick={() => handleSubscribe(null)}
              className="h-14 px-8 text-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-xl shadow-[#14B8A6]/20 rounded-full transition-all hover:scale-105"
            >
              Começar agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              className="h-14 px-8 text-lg border-[#334155] bg-transparent hover:bg-[#1E293B] text-gray-300 hover:text-white rounded-full"
              onClick={() => scrollToSection('features')}
            >
              Mais informações
            </Button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative w-full max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-[#0F172A]/80 border border-[#334155] backdrop-blur-md shadow-2xl relative z-20">
              <motion.div whileHover={{ scale: 1.01 }} className="h-64 md:h-72">
                <ConsciousCalculatorMock />
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} className="h-64 md:h-72">
                <CreditCardMock />
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} className="h-64 md:h-72">
                <DebtManagerMock />
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} className="h-64 md:h-72">
                <ReportMock />
              </motion.div>
            </div>
            
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Por que o Monex funciona?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Desenvolvido para quem quer resultados reais sem perder horas em planilhas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Clareza Imediata", text: "Entenda para onde vai cada centavo em segundos, não horas." },
              { icon: Target, title: "Metas Alcançadas", text: "Transforme sonhos distantes em planos concretos e realizáveis." },
              { icon: ShieldCheck, title: "Tranquilidade", text: "Durma melhor sabendo que suas finanças estão sob controle." },
              { icon: Clock, title: "Tempo Economizado", text: "Automação inteligente para você focar no que importa." },
              { icon: Lock, title: "Controle Total", text: "Nunca mais seja pego de surpresa por uma conta esquecida." },
              { icon: Smile, title: "Sem Culpa", text: "Alertas conscientes que ajudam, não julgam seus gastos." }
            ].map((benefit, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1E293B]/50 p-6 rounded-2xl border border-[#334155] hover:border-[#14B8A6]/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#14B8A6]/20 transition-colors">
                  <benefit.icon className="h-6 w-6 text-[#14B8A6]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400 leading-relaxed">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#0F172A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ferramentas poderosas, <br/> interface simples.
            </h2>
          </div>

          <div className="space-y-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#334155] shadow-2xl relative">
                  <div className="mt-4 space-y-6">
                     <div className="flex justify-between items-end">
                       <div>
                         <p className="text-gray-400 text-sm">Saldo Atual</p>
                         <h3 className="text-3xl font-bold text-white mt-1">R$ 14.250,00</h3>
                       </div>
                       <div className="text-right">
                         <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                           <TrendingUp className="h-4 w-4" /> +12%
                         </div>
                       </div>
                     </div>
                     <div className="h-40 w-full relative flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 75, 100].map((h, i) => (
                          <div key={i} className="w-full bg-gradient-to-t from-[#14B8A6]/10 to-[#14B8A6] rounded-t-sm opacity-80" style={{height: `${h}%`}}></div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] text-sm font-medium mb-4">
                  <BarChart3 className="h-4 w-4" /> Dashboard
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Controle na palma da mão</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Tenha uma visão clara de receitas, despesas e saldo em tempo real. 
                  Sinta a segurança de saber exatamente como está sua saúde financeira através de gráficos intuitivos que mostram sua evolução.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
                  <Calculator className="h-4 w-4" /> Calculadora Consciente
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Decisões sem arrependimentos</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Quer comprar algo caro? Nossa calculadora analisa seu saldo e metas para dizer se é o momento certo.
                  Acabe com a compra por impulso.
                </p>
              </div>
              <div>
                <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-2xl">
                  <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
                    <div className="text-sm text-gray-400 mb-2">Posso comprar um iPhone novo?</div>
                    <div className="flex items-center gap-3 text-amber-400 font-bold bg-amber-950/30 p-3 rounded-lg border border-amber-900/50">
                      <span className="text-xl">⚠️</span>
                      <span>Melhor esperar 2 meses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Escolha seu plano</h2>
          <p className="text-gray-400">Investimento pequeno para um retorno gigante na sua vida.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          
          {/* Semiannual */}
          <Card className="bg-[#1E293B] border-[#334155] text-white flex flex-col h-[420px] order-2 md:order-1">
            <CardHeader>
              <CardTitle>Semestral</CardTitle>
              <CardDescription>Equilíbrio e constância</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold mb-6">R$ 190,00<span className="text-sm font-normal text-gray-400">/semestre</span></div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> Acesso completo à plataforma</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> Suporte prioritário</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSubscribe({ id: 'price_1SmHU61SX0uvm0Le2Y80lwNw', name: 'Semestral', price: 190.00, interval: 'semestre' })}
                variant="outline" 
                className="w-full border-[#334155] hover:bg-[#0F172A] hover:text-white"
              >
                Assinar Semestral
              </Button>
            </CardFooter>
          </Card>

          {/* Monthly */}
          <Card className="bg-[#1E293B] border-[#14B8A6] text-white relative shadow-2xl shadow-[#14B8A6]/20 flex flex-col h-[480px] transform md:-translate-y-4 z-10 order-1 md:order-2 ring-2 ring-[#14B8A6]/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#14B8A6] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg">
              MELHOR CUSTO-BENEFÍCIO
            </div>
            <CardHeader className="pt-10">
              <CardTitle className="text-[#14B8A6]">Mensal</CardTitle>
              <CardDescription>Flexibilidade total</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-4xl font-bold mb-2">R$ 34,90<span className="text-sm font-normal text-gray-400">/mês</span></div>
              <p className="text-xs text-[#14B8A6] mb-8 font-medium bg-[#14B8A6]/10 inline-block px-2 py-1 rounded">Preço promocional</p>
              
              <ul className="space-y-4 text-sm text-gray-200">
                <li className="flex gap-3 items-center"><div className="bg-[#14B8A6]/20 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /></div> Acesso completo à plataforma</li>
                <li className="flex gap-3 items-center"><div className="bg-[#14B8A6]/20 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /></div> Suporte prioritário</li>
                <li className="flex gap-3 items-center"><div className="bg-[#14B8A6]/20 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /></div> Cancele quando quiser</li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                onClick={() => handleSubscribe({ id: 'price_1SmFKb1SX0uvm0LeBdMYktdz', name: 'Mensal', price: 34.90, interval: 'mês' })}
                className="w-full h-12 text-lg bg-[#14B8A6] hover:bg-[#0D9488] shadow-lg shadow-[#14B8A6]/25"
              >
                Assinar Mensal
              </Button>
            </CardFooter>
          </Card>

          {/* Annual */}
          <Card className="bg-[#1E293B] border-[#334155] text-white flex flex-col h-[420px] order-3">
            <CardHeader>
              <CardTitle>Anual</CardTitle>
              <CardDescription>Compromisso com o futuro</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold mb-6">R$ 350,00<span className="text-sm font-normal text-gray-400">/ano</span></div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> Acesso completo à plataforma</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> Suporte prioritário</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSubscribe({ id: 'price_1SmHUN1SX0uvm0LeeBv5W0Es', name: 'Anual', price: 350.00, interval: 'ano' })}
                variant="outline" 
                className="w-full border-[#334155] hover:bg-[#0F172A] hover:text-white"
              >
                Assinar Anual
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-[#1E293B] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-[#14B8A6] p-1.5 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Monex</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs">
                Sua plataforma completa para gestão financeira inteligente, segura e descomplicada.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#14B8A6]">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#14B8A6]">Política de Privacidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>suporte@monex.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1E293B] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">© 2024 Monex. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-gray-600">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs">Ambiente Seguro e Criptografado</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
