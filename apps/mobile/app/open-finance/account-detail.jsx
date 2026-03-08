/**
 * Tela de detalhe de uma conta bancária
 * Exibe saldo e lista de transações filtradas para essa conta.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@shared/theme';
import { formatCurrency } from '@shared/utils/formatters';
import { groupTransactionsByDate, getInstitutionColor } from '@shared/utils/openFinanceHelpers';
import { useOpenFinance } from '@/contexts/OpenFinanceContext';
import { TransactionItem, DateGroupHeader, EmptyState } from '@/components/OpenFinanceUI';

export default function AccountDetailScreen() {
  const { accountId, accountName } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, fetchFilteredTransactions } = useOpenFinance();

  const [accountTransactions, setAccountTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const account = useMemo(
    () => accounts.find(a => a.id === accountId),
    [accounts, accountId]
  );

  const institutionColor = getInstitutionColor(
    account?.open_finance_connections?.institution_name
  );

  const loadTransactions = useCallback(async () => {
    const { data } = await fetchFilteredTransactions({ accountId });
    setAccountTransactions(data || []);
    setLoading(false);
  }, [accountId, fetchFilteredTransactions]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const groupedData = useMemo(
    () => groupTransactionsByDate(accountTransactions),
    [accountTransactions]
  );

  const renderItem = useCallback(({ item: group }) => (
    <View>
      <DateGroupHeader
        label={group.label}
        totalIncome={group.totalIncome}
        totalExpense={group.totalExpense}
      />
      {group.transactions.map(tx => (
        <TransactionItem key={tx.id} transaction={tx} />
      ))}
    </View>
  ), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{accountName || 'Conta'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Saldo */}
      {account && (
        <View style={[styles.balanceCard, { borderLeftColor: institutionColor, borderLeftWidth: 4 }]}>
          <View>
            <Text style={styles.balanceLabel}>Saldo Atual</Text>
            <Text style={[
              styles.balanceValue,
              { color: (account.balance || 0) >= 0 ? colors.success : colors.error },
            ]}>
              {formatCurrency(account.balance || 0)}
            </Text>
          </View>
          <Text style={styles.bankName}>
            {account.open_finance_connections?.institution_name || ''}
          </Text>
        </View>
      )}

      {/* Transações */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.date}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="Sem transações"
              description="Nenhuma transação encontrada nesta conta nos últimos 2 meses."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT,
  },
  backButton: { padding: spacing.sm },
  headerTitle: {
    color: colors.text.primary, fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold, flex: 1, textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.lg,
    padding: spacing.xl, marginHorizontal: spacing.xl, marginTop: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.DEFAULT,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  balanceLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 4 },
  balanceValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  bankName: { color: colors.text.secondary, fontSize: typography.fontSize.sm },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
