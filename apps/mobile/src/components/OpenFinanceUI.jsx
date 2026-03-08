/**
 * Componentes reutilizáveis de UI para Open Finance.
 * Todos seguem o design system do Monex (dark theme, teal primary).
 * 
 * Exportados de um único arquivo para manter o bundle leve
 * e evitar repetição de imports/styles entre telas.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@shared/theme';
import { formatCurrency } from '@shared/utils/formatters';
import {
  getInstitutionColor,
  getAccountTypeLabel,
  getConnectionStatus,
  getTransactionCategory,
  formatTransactionAmount,
  isIncome,
} from '@shared/utils/openFinanceHelpers';

// ─── Empty State ────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name={icon || 'cloud-outline'} size={48} color={colors.text.muted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary.DEFAULT} />
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

export function SectionHeader({ title, rightLabel, onRightPress, icon }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon && <Ionicons name={icon} size={18} color={colors.primary.DEFAULT} style={{ marginRight: spacing.sm }} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {rightLabel && (
        <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
          <Text style={styles.sectionRightLabel}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Connection Card (Banco conectado) ──────────────────────────────────────

export function ConnectionCard({ connection, onSync, onRemove }) {
  const institutionColor = getInstitutionColor(connection.institution_name);
  const status = getConnectionStatus(connection.status);

  return (
    <View style={styles.connectionCard}>
      <View style={styles.connectionHeader}>
        <View style={[styles.bankIcon, { backgroundColor: `${institutionColor}25` }]}>
          <Text style={[styles.bankIconText, { color: institutionColor }]}>
            {(connection.institution_name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{connection.institution_name}</Text>
          <View style={styles.statusRow}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.connectionActions}>
          {onSync && (
            <TouchableOpacity onPress={() => onSync(connection.id)} style={styles.iconButton}>
              <Ionicons name="sync-outline" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          )}
          {onRemove && (
            <TouchableOpacity onPress={() => onRemove(connection.id)} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Account Card (Conta bancária) ──────────────────────────────────────────

export function AccountCard({ account, onPress }) {
  const institutionColor = getInstitutionColor(
    account.open_finance_connections?.institution_name
  );

  return (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.accountLeft}>
        <View style={[styles.accountDot, { backgroundColor: institutionColor }]} />
        <View>
          <Text style={styles.accountName} numberOfLines={1}>{account.name || 'Conta'}</Text>
          <Text style={styles.accountType}>{getAccountTypeLabel(account.type)}</Text>
        </View>
      </View>
      <View style={styles.accountRight}>
        <Text style={[
          styles.accountBalance,
          { color: (account.balance || 0) >= 0 ? colors.success : colors.error },
        ]}>
          {formatCurrency(account.balance || 0)}
        </Text>
        {account.open_finance_connections?.institution_name && (
          <Text style={styles.accountInstitution} numberOfLines={1}>
            {account.open_finance_connections.institution_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Credit Card (Cartão do Open Finance) ───────────────────────────────────

export function OpenFinanceCreditCard({ card, onPress }) {
  const institutionColor = getInstitutionColor(
    card.open_finance_connections?.institution_name
  );
  const used = card.credit_limit 
    ? card.credit_limit - (card.available_credit_limit || 0) 
    : 0;
  const usagePercent = card.credit_limit ? (used / card.credit_limit) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.creditCard, { borderLeftColor: institutionColor, borderLeftWidth: 3 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.creditCardHeader}>
        <View>
          <Text style={styles.creditCardName} numberOfLines={1}>
            {card.name || card.brand || 'Cartão'}
          </Text>
          <Text style={styles.creditCardBank}>
            {card.open_finance_connections?.institution_name || ''}
          </Text>
        </View>
        <Ionicons name="card" size={24} color={institutionColor} />
      </View>

      {card.number && (
        <Text style={styles.creditCardNumber}>•••• {card.number.slice(-4)}</Text>
      )}

      <View style={styles.creditCardAmounts}>
        <View>
          <Text style={styles.creditCardLabel}>Fatura Atual</Text>
          <Text style={[styles.creditCardValue, { color: colors.error }]}>
            {formatCurrency(used)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.creditCardLabel}>Limite</Text>
          <Text style={styles.creditCardValue}>
            {formatCurrency(card.credit_limit || 0)}
          </Text>
        </View>
      </View>

      {/* Barra de uso */}
      <View style={styles.usageBarBg}>
        <View style={[
          styles.usageBarFill,
          {
            width: `${Math.min(usagePercent, 100)}%`,
            backgroundColor: usagePercent > 80 ? colors.error 
              : usagePercent > 50 ? colors.warning 
              : colors.success,
          },
        ]} />
      </View>
      <Text style={styles.usagePercent}>
        {usagePercent.toFixed(0)}% utilizado
      </Text>
    </TouchableOpacity>
  );
}

// ─── Transaction Item ───────────────────────────────────────────────────────

export function TransactionItem({ transaction, showBank = false }) {
  const category = getTransactionCategory(transaction.category, transaction.description);
  const income = isIncome(transaction);
  const amountText = formatTransactionAmount(transaction.amount, transaction.type);

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: `${category.color}20` }]}>
        <Ionicons name={category.icon} size={20} color={category.color} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {transaction.description || 'Sem descrição'}
        </Text>
        <Text style={styles.transactionCategory}>
          {category.label}
          {showBank && transaction.open_finance_accounts?.open_finance_connections?.institution_name
            ? ` · ${transaction.open_finance_accounts.open_finance_connections.institution_name}`
            : ''}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: income ? colors.success : colors.text.primary },
      ]}>
        {amountText}
      </Text>
    </View>
  );
}

// ─── Loan Card (Dívida/Empréstimo) ─────────────────────────────────────────

export function LoanCard({ loan }) {
  const institutionColor = getInstitutionColor(
    loan.open_finance_connections?.institution_name
  );

  return (
    <View style={[styles.loanCard, { borderLeftColor: colors.error, borderLeftWidth: 3 }]}>
      <View style={styles.loanHeader}>
        <View>
          <Text style={styles.loanName}>{loan.name || 'Empréstimo'}</Text>
          <Text style={styles.loanBank}>
            {loan.open_finance_connections?.institution_name || ''}
          </Text>
        </View>
        <Ionicons name="alert-circle-outline" size={22} color={colors.error} />
      </View>
      <View style={styles.loanDetails}>
        <View>
          <Text style={styles.loanLabel}>Saldo Devedor</Text>
          <Text style={[styles.loanValue, { color: colors.error }]}>
            {formatCurrency(loan.outstanding_balance || 0)}
          </Text>
        </View>
        {loan.installment_amount && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.loanLabel}>Parcela</Text>
            <Text style={styles.loanValue}>
              {formatCurrency(loan.installment_amount)}
              {loan.remaining_installments ? ` (${loan.remaining_installments}x)` : ''}
            </Text>
          </View>
        )}
      </View>
      {loan.due_date && (
        <Text style={styles.loanDueDate}>
          Vencimento: {new Date(loan.due_date).toLocaleDateString('pt-BR')}
        </Text>
      )}
    </View>
  );
}

// ─── Summary Card ───────────────────────────────────────────────────────────

export function SummaryCard({ icon, label, value, color, subtitle }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color || colors.primary.DEFAULT}20` }]}>
        <Ionicons name={icon} size={22} color={color || colors.primary.DEFAULT} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Connect Bank Button ────────────────────────────────────────────────────

export function ConnectBankButton({ onPress, loading: isLoading, compact = false }) {
  if (compact) {
    return (
      <TouchableOpacity style={styles.connectCompact} onPress={onPress} disabled={isLoading} activeOpacity={0.8}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color={colors.primary.DEFAULT} />
            <Text style={styles.connectCompactText}>Conectar Banco</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.connectButton} onPress={onPress} disabled={isLoading} activeOpacity={0.8}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text.inverse} />
      ) : (
        <>
          <Ionicons name="business-outline" size={22} color={colors.text.inverse} style={{ marginRight: spacing.sm }} />
          <Text style={styles.connectButtonText}>Conectar Banco</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '70%' }]} />
            <View style={[styles.skeletonLine, { width: '45%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Date Group Header (para lista de transações) ──────────────────────────

export function DateGroupHeader({ label, totalIncome, totalExpense }) {
  return (
    <View style={styles.dateGroupHeader}>
      <Text style={styles.dateGroupLabel}>{label}</Text>
      <View style={styles.dateGroupAmounts}>
        {totalIncome > 0 && (
          <Text style={[styles.dateGroupAmount, { color: colors.success }]}>
            +{formatCurrency(totalIncome)}
          </Text>
        )}
        {totalExpense > 0 && (
          <Text style={[styles.dateGroupAmount, { color: colors.error }]}>
            -{formatCurrency(totalExpense)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing['2xl'] },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.text.muted}15`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, textAlign: 'center', marginBottom: spacing.sm },
  emptyDescription: { color: colors.text.secondary, fontSize: typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, backgroundColor: `${colors.primary.DEFAULT}15`, borderRadius: borderRadius.lg },
  emptyActionText: { color: colors.primary.DEFAULT, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginLeft: spacing.sm },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  sectionRightLabel: { color: colors.primary.DEFAULT, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },

  // Connection Card
  connectionCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: spacing.md },
  connectionHeader: { flexDirection: 'row', alignItems: 'center' },
  bankIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  bankIconText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  connectionInfo: { flex: 1, marginLeft: spacing.md },
  connectionName: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusText: { fontSize: typography.fontSize.xs, marginLeft: 4 },
  connectionActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { padding: spacing.sm },

  // Account Card
  accountCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  accountDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  accountName: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, maxWidth: 140 },
  accountType: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 1 },
  accountRight: { alignItems: 'flex-end' },
  accountBalance: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  accountInstitution: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 1, maxWidth: 100 },

  // Credit Card
  creditCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: spacing.md },
  creditCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  creditCardName: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, maxWidth: 200 },
  creditCardBank: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 2 },
  creditCardNumber: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontFamily: 'monospace', marginBottom: spacing.md },
  creditCardAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  creditCardLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 2 },
  creditCardValue: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  usageBarBg: { height: 6, backgroundColor: `${colors.text.muted}30`, borderRadius: 3, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 3 },
  usagePercent: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 4, textAlign: 'right' },

  // Transaction Item
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  transactionInfo: { flex: 1, marginLeft: spacing.md },
  transactionDescription: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  transactionCategory: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 2 },
  transactionAmount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },

  // Loan Card
  loanCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: spacing.md },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  loanName: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  loanBank: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 2 },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  loanLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 2 },
  loanValue: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  loanDueDate: { color: colors.text.secondary, fontSize: typography.fontSize.xs, marginTop: spacing.xs },

  // Summary Card
  summaryCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, width: '48%', marginBottom: spacing.md },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  summaryLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 4 },
  summaryValue: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  summarySubtitle: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 2 },

  // Connect Bank Button
  connectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.DEFAULT, borderRadius: borderRadius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing['2xl'], ...shadows.md },
  connectButtonText: { color: colors.text.inverse, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  connectCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  connectCompactText: { color: colors.primary.DEFAULT, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginLeft: spacing.xs },

  // Loading Skeleton
  skeletonContainer: { paddingVertical: spacing.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  skeletonCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.text.muted}20` },
  skeletonLines: { flex: 1, marginLeft: spacing.md },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: `${colors.text.muted}15`, marginBottom: spacing.xs },

  // Date Group Header
  dateGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, marginTop: spacing.md, marginBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  dateGroupLabel: { color: colors.text.secondary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, textTransform: 'uppercase' },
  dateGroupAmounts: { flexDirection: 'row', gap: spacing.md },
  dateGroupAmount: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
});
