/**
 * Tela de todos os cartões de crédito do Open Finance
 */

import React, { useState, useCallback } from 'react';
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
import { useOpenFinance } from '@/contexts/OpenFinanceContext';
import { OpenFinanceCreditCard, SectionHeader, EmptyState } from '@/components/OpenFinanceUI';

export default function CreditCardsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { creditCards, loading, loadAllData } = useOpenFinance();
  const [refreshing, setRefreshing] = useState(false);

  const totalLimit = creditCards.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const totalUsed = creditCards.reduce((s, c) => s + (c.credit_limit || 0) - (c.available_credit_limit || 0), 0);
  const usagePercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData(false);
    setRefreshing(false);
  }, [loadAllData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cartões de Crédito</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading.creditCards && creditCards.length === 0 ? (
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
          {/* Resumo de cartões */}
          {creditCards.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Total Usado</Text>
                  <Text style={[styles.summaryValue, { color: colors.error }]}>
                    {formatCurrency(totalUsed)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryLabel}>Limite Total</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalLimit)}</Text>
                </View>
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
              <Text style={styles.barPercent}>
                {usagePercent.toFixed(0)}% do limite total utilizado
              </Text>
            </View>
          )}

          {/* Lista de cartões */}
          <SectionHeader title={`${creditCards.length} Cartão(ões)`} icon="card-outline" />

          {creditCards.length > 0 ? (
            creditCards.map(card => (
              <OpenFinanceCreditCard
                key={card.id}
                card={card}
                onPress={() => router.push({
                  pathname: '/open-finance/card-detail',
                  params: { cardId: card.id, cardName: card.name || card.brand },
                })}
              />
            ))
          ) : (
            <EmptyState
              icon="card-outline"
              title="Nenhum cartão encontrado"
              description="Cartões de crédito aparecerão aqui após conectar um banco."
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

  summaryCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.xl,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border.DEFAULT,
    marginBottom: spacing.xl,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  summaryLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 4 },
  summaryValue: { color: colors.text.primary, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  barBg: { height: 8, backgroundColor: `${colors.text.muted}30`, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barPercent: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: spacing.xs, textAlign: 'center' },
});
