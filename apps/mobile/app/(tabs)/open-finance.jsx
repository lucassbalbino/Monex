/**
 * Tela principal do Open Finance — Tab "Bancos"
 * 
 * Exibe o panorama geral: saldo consolidado, bancos conectados,
 * contas, cartões e transações recentes. Modo READ-ONLY.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Alert, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@shared/theme';
import { formatCurrency } from '@shared/utils/formatters';
import { useOpenFinance } from '@/contexts/OpenFinanceContext';
import {
  EmptyState, SectionHeader, ConnectionCard, AccountCard,
  OpenFinanceCreditCard, TransactionItem, LoanCard,
  SummaryCard, ConnectBankButton, LoadingSkeleton,
} from '@/components/OpenFinanceUI';

export default function OpenFinanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    connections, accounts, transactions, creditCards, loans, summary,
    loading, error, hasConnections,
    getConnectToken, addConnection, deleteConnection,
    refreshAll, refreshConnection,
  } = useOpenFinance();

  const [refreshing, setRefreshing] = useState(false);

  // ─── Pull to Refresh ──────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  // ─── Conectar Banco (Pluggy Connect) ──────────────────────────────────

  const handleConnectBank = useCallback(async () => {
    const { token, error: tokenError } = await getConnectToken();
    if (tokenError || !token) {
      Alert.alert('Erro', 'Não foi possível iniciar a conexão. Tente novamente.');
      return;
    }
    // Navega para a tela do WebView com o Pluggy Connect
    router.push({
      pathname: '/open-finance/connect',
      params: { connectToken: token },
    });
  }, [getConnectToken, router]);

  // ─── Remover Banco ────────────────────────────────────────────────────

  const handleRemoveBank = useCallback((connectionId) => {
    const conn = connections.find(c => c.id === connectionId);
    Alert.alert(
      'Desconectar Banco',
      `Tem certeza que deseja remover ${conn?.institution_name || 'este banco'}? Todos os dados serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await deleteConnection(connectionId);
            if (err) Alert.alert('Erro', 'Não foi possível remover a conexão.');
          },
        },
      ]
    );
  }, [connections, deleteConnection]);

  // ─── Loading State ────────────────────────────────────────────────────

  if (loading.initial && !hasConnections) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Open Finance</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Carregando dados bancários...</Text>
        </View>
      </View>
    );
  }

  // ─── Empty State (sem bancos conectados) ──────────────────────────────

  if (!hasConnections) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Open Finance</Text>
        </View>
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <EmptyState
            icon="business-outline"
            title="Conecte seus bancos"
            description="Visualize saldos, cartões, transações e dívidas de todos os seus bancos em um só lugar. Modo leitura — seguro e privado."
          />
          <View style={styles.featureList}>
            <FeatureItem icon="wallet-outline" text="Saldos de todas as contas" />
            <FeatureItem icon="card-outline" text="Cartões de crédito e faturas" />
            <FeatureItem icon="receipt-outline" text="Transações dos últimos 2 meses" />
            <FeatureItem icon="alert-circle-outline" text="Dívidas e empréstimos" />
            <FeatureItem icon="shield-checkmark-outline" text="Apenas leitura — 100% seguro" />
          </View>
          <View style={styles.connectContainer}>
            <ConnectBankButton onPress={handleConnectBank} loading={loading.connecting} />
          </View>
          <Text style={styles.disclaimer}>
            Seus dados são protegidos por criptografia e você pode desconectar a qualquer momento.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ─── Main View (com dados) ────────────────────────────────────────────

  const recentTransactions = transactions.slice(0, 8);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Open Finance</Text>
        <View style={styles.headerActions}>
          <ConnectBankButton onPress={handleConnectBank} loading={loading.connecting} compact />
        </View>
      </View>

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
        {/* Erro */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Resumo Consolidado */}
        {summary && (
          <View style={styles.summaryGrid}>
            <SummaryCard
              icon="wallet-outline"
              label="Saldo Total"
              value={formatCurrency(summary.totalBalance)}
              color={summary.totalBalance >= 0 ? colors.success : colors.error}
              subtitle={`${summary.accountsCount} conta${summary.accountsCount !== 1 ? 's' : ''}`}
            />
            <SummaryCard
              icon="card-outline"
              label="Crédito Usado"
              value={formatCurrency(summary.totalCreditUsed)}
              color={colors.warning}
              subtitle={`de ${formatCurrency(summary.totalCreditLimit)}`}
            />
            <SummaryCard
              icon="trending-down-outline"
              label="Dívidas"
              value={formatCurrency(summary.totalDebt)}
              color={colors.error}
              subtitle={`${summary.loansCount} empréstimo${summary.loansCount !== 1 ? 's' : ''}`}
            />
            <SummaryCard
              icon="business-outline"
              label="Bancos"
              value={String(connections.length)}
              color={colors.primary.DEFAULT}
              subtitle="conectados"
            />
          </View>
        )}

        {/* Bancos Conectados */}
        <SectionHeader title="Bancos Conectados" icon="business-outline" />
        {loading.connections ? (
          <LoadingSkeleton rows={2} />
        ) : (
          connections.map(conn => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onSync={refreshConnection}
              onRemove={handleRemoveBank}
            />
          ))
        )}

        {/* Contas */}
        {accounts.length > 0 && (
          <>
            <SectionHeader
              title="Contas"
              icon="wallet-outline"
              rightLabel="Ver todas"
              onRightPress={() => router.push('/open-finance/accounts')}
            />
            {loading.accounts ? <LoadingSkeleton rows={2} /> : (
              accounts.slice(0, 4).map(account => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onPress={() => router.push({
                    pathname: '/open-finance/account-detail',
                    params: { accountId: account.id, accountName: account.name },
                  })}
                />
              ))
            )}
          </>
        )}

        {/* Cartões de Crédito */}
        {creditCards.length > 0 && (
          <>
            <SectionHeader
              title="Cartões de Crédito"
              icon="card-outline"
              rightLabel="Ver todos"
              onRightPress={() => router.push('/open-finance/credit-cards')}
            />
            {loading.creditCards ? <LoadingSkeleton rows={2} /> : (
              creditCards.slice(0, 3).map(card => (
                <OpenFinanceCreditCard
                  key={card.id}
                  card={card}
                  onPress={() => router.push({
                    pathname: '/open-finance/card-detail',
                    params: { cardId: card.id, cardName: card.name || card.brand },
                  })}
                />
              ))
            )}
          </>
        )}

        {/* Transações Recentes */}
        {recentTransactions.length > 0 && (
          <>
            <SectionHeader
              title="Transações Recentes"
              icon="receipt-outline"
              rightLabel="Ver todas"
              onRightPress={() => router.push('/open-finance/transactions')}
            />
            <View style={styles.transactionsList}>
              {loading.transactions ? <LoadingSkeleton rows={4} /> : (
                recentTransactions.map(tx => (
                  <TransactionItem key={tx.id} transaction={tx} showBank />
                ))
              )}
            </View>
          </>
        )}

        {/* Dívidas */}
        {loans.length > 0 && (
          <>
            <SectionHeader title="Dívidas e Empréstimos" icon="alert-circle-outline" />
            {loans.map(loan => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </>
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-component ──────────────────────────────────────────────────────────

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color={colors.primary.DEFAULT} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT,
  },
  headerTitle: { color: colors.text.primary, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  
  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, marginTop: spacing.lg },

  // Empty
  emptyContent: { flexGrow: 1, paddingHorizontal: spacing.xl },
  featureList: { marginTop: spacing.xl, marginBottom: spacing['2xl'] },
  featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  featureText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, marginLeft: spacing.md },
  connectContainer: { alignItems: 'center', marginBottom: spacing.xl },
  disclaimer: { color: colors.text.muted, fontSize: typography.fontSize.xs, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.xl },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.error}15`, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: typography.fontSize.sm, marginLeft: spacing.sm, flex: 1 },

  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },

  // Transactions list
  transactionsList: { backgroundColor: colors.background.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT, marginBottom: spacing.xl },
});
