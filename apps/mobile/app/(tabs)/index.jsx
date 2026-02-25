import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@shared/utils/formatters';
import { colors, spacing, typography, borderRadius, shadows } from '@shared/theme';
import StatsCard from '@/components/StatsCard';
import QuickActions from '@/components/QuickActions';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { financialData, refreshData, loading } = useFinancial();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const userName = session?.user?.user_metadata?.name || 'Usuário';
  const greeting = getGreeting();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
            colors={[colors.primary.DEFAULT]}
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Atual</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(financialData?.balance ?? 0)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up-circle" size={18} color={colors.success} />
              <Text style={styles.balanceItemLabel}>Receitas</Text>
              <Text style={[styles.balanceItemValue, { color: colors.success }]}>
                {formatCurrency(financialData?.income ?? 0)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down-circle" size={18} color={colors.error} />
              <Text style={styles.balanceItemLabel}>Despesas</Text>
              <Text style={[styles.balanceItemValue, { color: colors.error }]}>
                {formatCurrency(financialData?.expenses ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats */}
        <Text style={styles.sectionTitle}>Visão Geral</Text>
        <View style={styles.statsGrid}>
          <StatsCard
            title="Metas Ativas"
            value={financialData?.goalsCount ?? 0}
            icon="flag-outline"
            color={colors.primary.DEFAULT}
          />
          <StatsCard
            title="Limites"
            value={financialData?.limitsCount ?? 0}
            icon="speedometer-outline"
            color={colors.warning}
          />
          <StatsCard
            title="Dívidas"
            value={financialData?.debtsCount ?? 0}
            icon="alert-circle-outline"
            color={colors.error}
          />
          <StatsCard
            title="Desafios"
            value={financialData?.challengesCount ?? 0}
            icon="trophy-outline"
            color="#A855F7"
          />
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Transações Recentes</Text>
        {(financialData?.recentTransactions ?? []).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Nenhuma transação registrada</Text>
            <Text style={styles.emptySubtext}>
              Comece adicionando suas receitas e despesas
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {(financialData?.recentTransactions ?? []).slice(0, 5).map((tx, i) => (
              <View key={tx.id || i} style={styles.transactionItem}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? `${colors.success}20` : `${colors.error}20` }]}>
                  <Ionicons
                    name={tx.type === 'income' ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={tx.type === 'income' ? colors.success : colors.error}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDescription}>{tx.description || tx.category}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.success : colors.error }]}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  greeting: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  userName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  balanceCard: {
    backgroundColor: colors.primary[800],
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary[700],
    ...shadows.lg,
  },
  balanceLabel: {
    color: colors.primary[200],
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    marginBottom: spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.primary[600],
  },
  balanceItemLabel: {
    color: colors.primary[200],
    fontSize: typography.fontSize.xs,
  },
  balanceItemValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  emptyText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  transactionsList: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  txDate: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  txAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
