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
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency, formatPercentage } from '@shared/utils/formatters';
import { colors, spacing, typography, borderRadius } from '@shared/theme';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { financialData, refreshData } = useFinancial();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const goals = financialData?.goals ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
        }
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Nenhuma meta criada</Text>
            <Text style={styles.emptySubtext}>Defina metas para alcançar seus objetivos financeiros</Text>
          </View>
        ) : (
          goals.map((goal, i) => {
            const progress = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;

            return (
              <View key={goal.id || i} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleRow}>
                    <Ionicons
                      name={goal.isDefault ? 'shield-checkmark' : 'flag'}
                      size={20}
                      color={colors.primary.DEFAULT}
                    />
                    <Text style={styles.goalName}>{goal.name}</Text>
                  </View>
                  {goal.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Padrão</Text>
                    </View>
                  )}
                </View>

                {goal.description && (
                  <Text style={styles.goalDesc}>{goal.description}</Text>
                )}

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? colors.success : colors.primary.DEFAULT,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{formatPercentage(progress, 0)}</Text>
                </View>

                <View style={styles.goalFooter}>
                  <View>
                    <Text style={styles.goalAmountLabel}>Atual</Text>
                    <Text style={styles.goalAmountValue}>
                      {formatCurrency(goal.currentAmount)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.goalAmountLabel}>Meta</Text>
                    <Text style={styles.goalAmountValue}>
                      {formatCurrency(goal.targetAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing['2xl'], paddingVertical: spacing.lg,
  },
  title: { color: colors.text.primary, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  addButton: {
    width: 44, height: 44, borderRadius: borderRadius.full,
    backgroundColor: colors.primary.DEFAULT, justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'] },
  emptyState: {
    alignItems: 'center', paddingVertical: spacing['5xl'],
    backgroundColor: colors.background.card, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  emptyText: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, marginTop: spacing.md },
  emptySubtext: { color: colors.text.muted, fontSize: typography.fontSize.sm, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl },
  goalCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.xl,
    padding: spacing['2xl'], borderWidth: 1, borderColor: colors.border.DEFAULT,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  goalName: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  defaultBadge: {
    backgroundColor: `${colors.primary.DEFAULT}20`, paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: borderRadius.sm,
  },
  defaultBadgeText: { color: colors.primary.DEFAULT, fontSize: typography.fontSize.xs },
  goalDesc: { color: colors.text.muted, fontSize: typography.fontSize.sm, marginBottom: spacing.md, lineHeight: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  progressBar: {
    flex: 1, height: 8, backgroundColor: colors.border.DEFAULT,
    borderRadius: borderRadius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  progressText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, minWidth: 40, textAlign: 'right' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  goalAmountLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginBottom: 2 },
  goalAmountValue: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
});
