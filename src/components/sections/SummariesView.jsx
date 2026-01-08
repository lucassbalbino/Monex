
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinancialData } from '@/context/FinancialContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/utils';

const SummariesView = () => {
  const { transactions } = useFinancialData();
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'annual'
  
  // Date State
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  // Constants
  const months = [
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' },
  ];

  // Derive available years from transactions + current year
  const availableYears = Array.from(new Set([
    today.getFullYear(),
    ...transactions.map(t => {
      if (!t.date) return today.getFullYear();
      return parseInt(t.date.split('-')[0]);
    })
  ])).sort((a, b) => b - a);

  // Helper for display
  const getSelectedMonthName = () => {
    return months.find(m => m.value === selectedMonth)?.label || '';
  };

  // Filter transactions based on view mode and selection
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    // Parse date manually to avoid timezone issues
    const [year, month, day] = t.date.split('-').map(Number);
    const tDate = new Date(year, month - 1, day);

    // Filter by Year (applies to both modes)
    if (tDate.getFullYear() !== parseInt(selectedYear)) {
      return false;
    }

    // Filter by Month (only for monthly mode)
    if (viewMode === 'monthly') {
      return tDate.getMonth() === parseInt(selectedMonth);
    }

    return true;
  });

  // Process data for charts
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');

  const expensesByCategory = expenseTransactions.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const data = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF6B6B', '#4ECDC4'];

  // Calculate totals for summary cards
  const totalIncome = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Relatórios e Resumos</h1>
          <p className="text-gray-400">
            Análise detalhada • <span className="text-[#14B8A6] font-semibold">
              {viewMode === 'monthly' 
                ? `${getSelectedMonthName()} / ${selectedYear}` 
                : `Ano ${selectedYear}`}
            </span>
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5 }}
           className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#1E293B] p-2 rounded-xl border border-[#334155]"
        >
          {/* Controls Group */}
          <div className="flex gap-2 w-full sm:w-auto">
            {viewMode === 'monthly' && (
              <div className="w-[140px]">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white h-9">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-[#334155] text-white max-h-[300px]">
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value} className="focus:bg-[#334155] focus:text-white cursor-pointer">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="w-[100px]">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white h-9">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)} className="focus:bg-[#334155] focus:text-white cursor-pointer">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-6 w-px bg-[#334155] hidden sm:block"></div>

          {/* View Mode Toggle */}
          <div className="flex bg-[#0F172A] p-1 rounded-lg border border-[#334155] w-full sm:w-auto">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'monthly' 
                  ? 'bg-[#334155] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-[#334155]/50'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'annual' 
                  ? 'bg-[#334155] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-[#334155]/50'
              }`}
            >
              Anual
            </button>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
        >
          <h3 className="text-gray-400 text-sm mb-1">Receita {viewMode === 'monthly' ? 'Mensal' : 'Anual'}</h3>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
        >
          <h3 className="text-gray-400 text-sm mb-1">Despesa {viewMode === 'monthly' ? 'Mensal' : 'Anual'}</h3>
          <p className="text-2xl font-bold text-amber-500">{formatCurrency(totalExpenses)}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
        >
          <h3 className="text-gray-400 text-sm mb-1">Saldo {viewMode === 'monthly' ? 'Mensal' : 'Anual'}</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            {formatCurrency(balance)}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
        >
          <h2 className="text-xl font-bold text-white mb-6">Despesas por Categoria ({viewMode === 'monthly' ? 'Mês' : 'Ano'})</h2>
          <div className="h-[300px] w-full">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                <PieChart className="h-8 w-8 opacity-20" />
                <span>Sem dados de despesas para este período</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]"
        >
          <h2 className="text-xl font-bold text-white mb-6">Extrato ({viewMode === 'monthly' ? getSelectedMonthName() : `Ano ${selectedYear}`})</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredTransactions.slice(0, 10).map((t, index) => (
              <div key={t.id || index} className="flex justify-between items-center border-b border-[#334155] pb-3 last:border-0 last:pb-0 hover:bg-[#334155]/20 p-2 rounded transition-colors">
                <div>
                  <p className="font-medium text-white line-clamp-1" title={t.description}>{t.description}</p>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] bg-[#0F172A] px-1.5 py-0.5 rounded text-gray-400 border border-[#334155]">{t.category}</span>
                     <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                </div>
                <span className={`font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-green-500' : 'text-amber-500'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
                <p>Nenhuma movimentação registrada neste período.</p>
              </div>
            )}
             {filteredTransactions.length > 10 && (
              <p className="text-xs text-center text-gray-500 pt-2 italic">Exibindo as 10 movimentações mais recentes</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SummariesView;
