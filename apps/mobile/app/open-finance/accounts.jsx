/**
 * Tela de todas as contas bancárias do Open Finance
 * Agrupadas por instituição financeira.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@shared/theme';
import { formatCurrency } from '@shared/utils/formatters';
import { groupAccountsByInstitution, getInstitutionColor } from '@shared/utils/openFinanceHelpers';
import { useOpenFinance } from '@/contexts/OpenFinanceContext';
import { AccountCard, SectionHeader, EmptyState } from '@/components/OpenFinanceUI';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, loading, loadAllData } = useOpenFinance();
  const [refreshing, setRefreshing] = useState(false);

  const groups = useMemo(() => groupAccountsByInstitution(accounts), [accounts]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
    [accounts]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData(false);
    setRefreshing(false);
  }, [loadAllData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading.accounts && accounts.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
        >
          {/* Saldo Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Saldo Total</Text>
            <Text style={[
              styles.totalValue,
              { color: totalBalance >= 0 ? colors.success : colors.error },
            ]}>
              {formatCurrency(totalBalance)}
            </Text>
            <Text style={styles.totalSubtitle}>
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''} em {groups.length} banco{groups.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Grupos por Banco */}
          {groups.length > 0 ? (
            groups.map(group => (
              <View key={group.institution} style={styles.bankGroup}>
                <View style={styles.bankGroupHeader}>
                  <View style={[styles.bankDot, { backgroundColor: group.color }]} />
                  <Text style={styles.bankGroupName}>{group.institution}</Text>
                  <Text style={[
                    styles.bankGroupBalance,
                    { color: group.totalBalance >= 0 ? colors.success : colors.error },
                  ]}>
                    {formatCurrency(group.totalBalance)}
                  </Text>
                </View>
                {group.accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onPress={() => router.push({
                      pathname: '/open-finance/account-detail',
                      params: { accountId: account.id, accountName: account.name },
                    })}
                  />
                ))}
              </View>
            ))
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Nenhuma conta encontrada"
              description="Conecte um banco para ver suas contas aqui."
            />
          )}

          <View style={{ height: spacing['3xl'] }} />
        </ScrollView>
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Total Card
  totalCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.xl,
    padding: spacing['2xl'], borderWidth: 1, borderColor: colors.border.DEFAULT,
    alignItems: 'center', marginBottom: spacing.xl,
  },
  totalLabel: { color: colors.text.secondary, fontSize: typography.fontSize.sm, marginBottom: spacing.xs },
  totalValue: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold },
  totalSubtitle: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: spacing.xs },

  // Bank Group
  bankGroup: { marginBottom: spacing.xl },
  bankGroupHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md,
    paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  bankDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  bankGroupName: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, flex: 1 },
  bankGroupBalance: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
});
