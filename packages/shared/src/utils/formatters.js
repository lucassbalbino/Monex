/**
 * Formatadores compartilhados — Monex
 * Reutilizados entre web e mobile
 */

/**
 * Formata um valor numérico como moeda BRL
 * @param {number} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata uma data para o formato brasileiro
 * @param {string|Date} date
 * @param {object} options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
};

/**
 * Formata o intervalo do plano
 * @param {string} interval
 * @returns {string}
 */
export const formatPlanInterval = (interval) => {
  const intervals = {
    month: 'Mensal',
    year: 'Anual',
    week: 'Semanal',
    day: 'Diário',
  };
  return intervals[interval] || interval;
};

/**
 * Formata o nome do plano para exibição
 * @param {string} name
 * @returns {string}
 */
export const formatPlanName = (name) => {
  if (!name) return 'Plano Monex';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Formata uma porcentagem com precisão
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formata um número abreviado (1.2K, 3.4M, etc.)
 * @param {number} num
 * @returns {string}
 */
export const formatCompactNumber = (num) => {
  if (num == null || isNaN(num)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
};

/**
 * Parse de string de data YYYY-MM-DD como data local (sem timezone offset)
 * @param {string} dateStr
 * @returns {Date}
 */
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
