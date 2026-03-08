/**
 * Tela de detalhe de um cartão de crédito (Open Finance)
 * Exibe informações do cartão e lista de faturas.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@shared/theme';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { getInstitutionColor } from '@shared/utils/openFinanceHelpers';
import { useOpenFinance } from '@/contexts/OpenFinanceContext';
import { EmptyState } from '@/components/OpenFinanceUI';

export default function CardDetailScreen() {
  const { cardId, cardName } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { creditCards, fetchCardBills } = useOpenFinance();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const card = useMemo(
    () => creditCards.find(c => c.id === cardId),
    [creditCards, cardId]
  );

  const institutionColor = getInstitutionColor(
    card?.open_finance_connections?.institution_name
  );

  const used = card ? (card.credit_limit || 0) - (card.available_credit_limit || 0) : 0;
  const usagePercent = card?.credit_limit ? (used / card.credit_limit) * 100 : 0;

  const loadBills = useCallback(async () => {
    const { data } = await fetchCardBills(cardId);
    setBills(data || []);
    setLoading(false);
  }, [cardId, fetchCardBills]);

  useEffect(() => { loadBills(); }, [loadBills]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  }, [loadBills]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{cardName || 'Cartão'}</Text>
        <View style={{ width: 40 }} />
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
        {/* Card Visual */}
        {card && (
          <View style={[styles.cardVisual, { backgroundColor: institutionColor }]}>
            <View style={styles.cardVisualHeader}>
              <Ionicons name="card" size={28} color="#FFFFFF" />
              <Text style={styles.cardBankName}>
                {card.open_finance_connections?.institution_name || ''}
              </Text>
            </View>
            {card.number && (
              <Text style={styles.cardNumber}>•••• •••• •••• {card.number.slice(-4)}</Text>
            )}
            <Text style={styles.cardNameOnCard}>{card.name || card.brand || 'Cartão'}</Text>
          </View>
        )}

        {/* Resumo de uso */}
        {card && (
          <View style={styles.usageCard}>
            <View style={styles.usageRow}>
              <View>
                <Text style={styles.usageLabel}>Fatura Atual</Text>
                <Text style={[styles.usageValue, { color: colors.error }]}>
                  {formatCurrency(used)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.usageLabel}>Disponível</Text>
                <Text style={[styles.usageValue, { color: colors.success }]}>
                  {formatCurrency(card.available_credit_limit || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.usageRow}>
              <View>
                <Text style={styles.usageLabel}>Limite Total</Text>
                <Text style={styles.usageValue}>{formatCurrency(card.credit_limit || 0)}</Text>
              </View>
              {card.close_date && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.usageLabel}>Fecha em</Text>
                  <Text style={styles.usageValue}>
                    {formatDate(new Date(card.close_date))}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.barBg}>
              <View style={[
                styles.barFill,
                {
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: usagePercent > 80 ? colors.error
                    : usagePercent > 50 ? colors.warning
                    : colors.success,
                },
              ]} />
            </View>
            <Text style={styles.barLabel}>{usagePercent.toFixed(0)}% utilizado</Text>
          </View>
        )}

        {/* Faturas */}
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary.DEFAULT} />
          <Text style={styles.sectionTitle}>Faturas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : bills.length > 0 ? (
          bills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="Sem faturas"
            description="Nenhuma fatura disponível para este cartão."
          />
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ─── Bill Card ──────────────────────────────────────────────────────────────

function BillCard({ bill }) {
  const isPaid = bill.status === 'PAID';
  const isOverdue = !isPaid && bill.due_date && new Date(bill.due_date) < new Date();

  return (
    <View style={styles.billCard}>
      <View style={styles.billHeader}>
        <View style={styles.billDateContainer}>
          <Ionicons
            name={isPaid ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time-outline'}
            size={18}
            color={isPaid ? colors.success : isOverdue ? colors.error : colors.warning}
          />
          <Text style={styles.billDate}>
            {bill.due_date ? formatDate(new Date(bill.due_date)) : 'Sem vencimento'}
          </Text>
        </View>
        <View style={[
          styles.billStatusBadge,
          { backgroundColor: isPaid ? `${colors.success}20` : isOverdue ? `${colors.error}20` : `${colors.warning}20` },
        ]}>
          <Text style={[
            styles.billStatusText,
            { color: isPaid ? colors.success : isOverdue ? colors.error : colors.warning },
          ]}>
            {isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'Aberta'}
          </Text>
        </View>
      </View>
      <View style={styles.billAmounts}>
        <View>
          <Text style={styles.billLabel}>Total</Text>
          <Text style={styles.billAmount}>{formatCurrency(bill.total_amount || 0)}</Text>
        </View>
        {bill.minimum_amount != null && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.billLabel}>Mínimo</Text>
            <Text style={styles.billAmountSmall}>{formatCurrency(bill.minimum_amount)}</Text>
          </View>
        )}
      </View>
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  loadingCenter: { paddingVertical: spacing['3xl'], alignItems: 'center' },

  // Card Visual
  cardVisual: {
    borderRadius: borderRadius.xl, padding: spacing.xl,
    marginBottom: spacing.lg, minHeight: 180, justifyContent: 'space-between',
  },
  cardVisualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['2xl'] },
  cardBankName: { color: '#FFFFFFCC', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  cardNumber: { color: '#FFFFFF', fontSize: typography.fontSize.xl, fontFamily: 'monospace', letterSpacing: 3, marginBottom: spacing.lg },
  cardNameOnCard: { color: '#FFFFFFBB', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, textTransform: 'uppercase' },

  // Usage Card
  usageCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.lg,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border.DEFAULT,
    marginBottom: spacing.xl,
  },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  usageLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 4 },
  usageValue: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  barBg: { height: 8, backgroundColor: `${colors.text.muted}30`, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: spacing.xs, textAlign: 'center' },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginLeft: spacing.sm },

  // Bill Card
  billCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border.DEFAULT,
    marginBottom: spacing.md,
  },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  billDateContainer: { flexDirection: 'row', alignItems: 'center' },
  billDate: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginLeft: spacing.sm },
  billStatusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  billStatusText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  billAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 2 },
  billAmount: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  billAmountSmall: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
});
