/**
 * Tela de todas as transações do Open Finance
 * 
 * Lista paginada com filtros, agrupadas por data.
 * Suporta scroll infinito e filtro por banco/conta.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@shared/theme';
import { groupTransactionsByDate } from '@shared/utils/openFinanceHelpers';
import { useOpenFinance } from '@/contexts/OpenFinanceContext';
import { TransactionItem, DateGroupHeader, EmptyState } from '@/components/OpenFinanceUI';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, connections, loading, fetchTransactions } = useOpenFinance();

  const [selectedConnection, setSelectedConnection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filtra transações por banco selecionado
  const filteredTransactions = useMemo(() => {
    if (!selectedConnection) return transactions;
    return transactions.filter(tx => tx.connection_id === selectedConnection);
  }, [transactions, selectedConnection]);

  // Agrupa por data
  const groupedData = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions({}, false);
    setRefreshing(false);
  }, [fetchTransactions]);

  const renderItem = useCallback(({ item: group }) => (
    <View>
      <DateGroupHeader
        label={group.label}
        totalIncome={group.totalIncome}
        totalExpense={group.totalExpense}
      />
      {group.transactions.map(tx => (
        <TransactionItem key={tx.id} transaction={tx} showBank />
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
        <Text style={styles.headerTitle}>Transações</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtro por banco */}
      {connections.length > 1 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedConnection && styles.filterChipActive]}
            onPress={() => setSelectedConnection(null)}
          >
            <Text style={[styles.filterChipText, !selectedConnection && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {connections.map(conn => (
            <TouchableOpacity
              key={conn.id}
              style={[styles.filterChip, selectedConnection === conn.id && styles.filterChipActive]}
              onPress={() => setSelectedConnection(
                selectedConnection === conn.id ? null : conn.id
              )}
            >
              <Text style={[
                styles.filterChipText,
                selectedConnection === conn.id && styles.filterChipTextActive,
              ]}>
                {conn.institution_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Lista */}
      {loading.transactions && !refreshing ? (
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
              title="Nenhuma transação"
              description="As transações dos últimos 2 meses aparecerão aqui após conectar um banco."
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
  headerTitle: { color: colors.text.primary, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    gap: spacing.sm, flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.border.DEFAULT, backgroundColor: colors.background.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary.DEFAULT, borderColor: colors.primary.DEFAULT,
  },
  filterChipText: { color: colors.text.secondary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  filterChipTextActive: { color: colors.text.inverse },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
