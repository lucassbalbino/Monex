
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useFinancialData } from '@/context/FinancialContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const TrackingView = () => {
  const { transactions } = useFinancialData();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'yearly'
  
  // Initialize with current month/year
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Helper to parse date string (YYYY-MM-DD) safely as local date
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // --- Data Processing ---

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [transactions]);

  // Group by Month & Year for Yearly View
  const monthlyData = useMemo(() => {
    const data = Array(12).fill(0).map((_, i) => ({
      name: MONTHS[i].slice(0, 3),
      fullName: MONTHS[i],
      income: 0,
      expense: 0,
      balance: 0,
      monthIndex: i
    }));

    transactions.forEach(t => {
      const date = parseDate(t.date);
      if (date.getFullYear() === selectedYear) {
        const monthIdx = date.getMonth();
        if (t.type === 'income') {
          data[monthIdx].income += t.amount;
        } else {
          data[monthIdx].expense += t.amount;
        }
      }
    });

    data.forEach(m => m.balance = m.income - m.expense);
    return data;
  }, [transactions, selectedYear]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    return monthlyData.reduce((acc, curr) => ({
      income: acc.income + curr.income,
      expense: acc.expense + curr.expense,
      balance: acc.balance + curr.balance
    }), { income: 0, expense: 0, balance: 0 });
  }, [monthlyData]);

  // Filter Transactions for "Monthly List" View
  const displayedTransactions = useMemo(() => {
    return sortedTransactions.filter(t => {
      const tDate = parseDate(t.date);
      const matchesYear = tDate.getFullYear() === selectedYear;
      
      // If filtering by specific month
      const matchesMonth = viewMode === 'monthly' ? tDate.getMonth() === selectedMonth : true;
      
      const matchesType = filter === 'all' || t.type === filter;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesYear && matchesMonth && matchesType && matchesSearch;
    });
  }, [sortedTransactions, viewMode, selectedMonth, selectedYear, filter, searchTerm]);

  // Monthly Totals for the currently selected month
  const currentMonthTotals = useMemo(() => {
    return displayedTransactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [displayedTransactions]);


  // --- Helper Functions ---

  const handleYearChange = (increment) => {
    setSelectedYear(prev => prev + increment);
  };

  const getTransactionDateString = (dateStr) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transações e Relatórios</h1>
          <p className="text-gray-400">Gerencie suas finanças por período</p>
        </div>

        <div className="flex items-center bg-[#1E293B] rounded-lg border border-[#334155] p-1">
          <Button
            variant={viewMode === 'monthly' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('monthly')}
            className={`h-8 text-sm ${viewMode === 'monthly' ? 'bg-[#334155] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Mensal
          </Button>
          <Button
            variant={viewMode === 'yearly' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('yearly')}
            className={`h-8 text-sm ${viewMode === 'yearly' ? 'bg-[#334155] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Anual
          </Button>
        </div>
      </motion.div>

      {/* Year Selector Control - Always visible */}
      <div className="flex items-center justify-center gap-4 bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
        <Button variant="ghost" size="icon" onClick={() => handleYearChange(-1)}>
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </Button>
        <span className="text-xl font-bold text-white">{selectedYear}</span>
        <Button variant="ghost" size="icon" onClick={() => handleYearChange(1)}>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
        
        {/* --- MONTHLY VIEW --- */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Month Selector Sidebar (Desktop) or Dropdown (Mobile) */}
            <div className="md:col-span-3 space-y-4">
              <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Selecionar Mês</h3>
                <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                  {MONTHS.map((month, index) => (
                    <Button
                      key={month}
                      variant="ghost"
                      onClick={() => setSelectedMonth(index)}
                      className={`justify-start ${selectedMonth === index 
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30' 
                        : 'text-gray-400 hover:text-white hover:bg-[#334155]'}`}
                    >
                      {month}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions List Area */}
            <div className="md:col-span-9 space-y-6">
              
              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col">
                  <span className="text-gray-400 text-xs">Entradas ({MONTHS[selectedMonth]})</span>
                  <span className="text-xl font-bold text-green-500">
                    + {formatCurrency(currentMonthTotals.income)}
                  </span>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col">
                  <span className="text-gray-400 text-xs">Saídas ({MONTHS[selectedMonth]})</span>
                  <span className="text-xl font-bold text-amber-500">
                    - {formatCurrency(currentMonthTotals.expense)}
                  </span>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col">
                  <span className="text-gray-400 text-xs">Saldo ({MONTHS[selectedMonth]})</span>
                  <span className={`text-xl font-bold ${currentMonthTotals.income - currentMonthTotals.expense >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    {formatCurrency(currentMonthTotals.income - currentMonthTotals.expense)}
                  </span>
                </div>
              </div>

              {/* Filters & List */}
              <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Buscar transações..." 
                      className="pl-10 bg-[#0F172A] border-[#334155] text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={filter === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilter('all')}
                      className={filter === 'all' ? "bg-blue-600 hover:bg-blue-700" : "bg-transparent border-[#334155] text-gray-300 hover:bg-[#334155]"}
                    >
                      Todas
                    </Button>
                    <Button 
                      variant={filter === 'income' ? 'default' : 'outline'}
                      onClick={() => setFilter('income')}
                      className={filter === 'income' ? "bg-green-600 hover:bg-green-700" : "bg-transparent border-[#334155] text-gray-300 hover:bg-[#334155]"}
                    >
                      Receitas
                    </Button>
                    <Button 
                      variant={filter === 'expense' ? 'default' : 'outline'}
                      onClick={() => setFilter('expense')}
                      className={filter === 'expense' ? "bg-amber-600 hover:bg-amber-700" : "bg-transparent border-[#334155] text-gray-300 hover:bg-[#334155]"}
                    >
                      Despesas
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {displayedTransactions.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                      <div className="bg-[#334155]/30 p-4 rounded-full mb-3">
                        <CalendarIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white">Nenhuma transação encontrada</h3>
                      <p className="text-gray-400 text-sm">Não há registros para este período ou filtro.</p>
                    </div>
                  ) : (
                    displayedTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-[#475569] transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {transaction.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{transaction.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                               <span>{transaction.category}</span>
                               <span>•</span>
                               <span>{getTransactionDateString(transaction.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-amber-500'}`}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- YEARLY VIEW --- */}
        <TabsContent value="yearly" className="space-y-6">
          
          {/* Annual Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
            >
              <h3 className="text-gray-400 text-sm mb-1">Receita Anual Total</h3>
              <p className="text-3xl font-bold text-green-500">
                {formatCurrency(annualTotals.income)}
              </p>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
            >
              <h3 className="text-gray-400 text-sm mb-1">Despesa Anual Total</h3>
              <p className="text-3xl font-bold text-amber-500">
                {formatCurrency(annualTotals.expense)}
              </p>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
            >
              <h3 className="text-gray-400 text-sm mb-1">Balanço Anual</h3>
              <p className={`text-3xl font-bold ${annualTotals.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {formatCurrency(annualTotals.balance)}
              </p>
            </motion.div>
          </div>

          {/* Yearly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
          >
            <h3 className="text-lg font-bold text-white mb-6">Comparativo Mensal {selectedYear}</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Monthly Breakdown Table */}
          <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
            <div className="grid grid-cols-4 bg-[#0F172A] p-4 font-medium text-gray-400 text-sm border-b border-[#334155]">
              <div>Mês</div>
              <div className="text-right">Receita</div>
              <div className="text-right">Despesa</div>
              <div className="text-right">Saldo</div>
            </div>
            <div className="divide-y divide-[#334155]">
              {monthlyData.map((data, index) => (
                <div key={index} className="grid grid-cols-4 p-4 text-sm hover:bg-[#334155]/20 transition-colors">
                  <div className="text-white font-medium">{data.fullName}</div>
                  <div className="text-right text-green-500">{formatCurrency(data.income)}</div>
                  <div className="text-right text-amber-500">{formatCurrency(data.expense)}</div>
                  <div className={`text-right font-bold ${data.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatCurrency(data.balance)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackingView;
