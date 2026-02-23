import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { EXPENSE_CATEGORIES } from '@shared/constants';
import { colors, spacing, typography, borderRadius, shadows } from '@shared/theme';

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { financialData, addTransaction, refreshData } = useFinancial();
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAdd = () => {
    if (!description || !amount) {
      Alert.alert('Erro', 'Preencha descrição e valor');
      return;
    }
    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }
    addTransaction({
      type: txType,
      description,
      amount: value,
      category: category || 'outros',
      date: new Date().toISOString().split('T')[0],
    });
    setDescription('');
    setAmount('');
    setCategory('');
    setShowForm(false);
  };

  const transactions = financialData?.transactions ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Rastreamento</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color={colors.text.inverse} />
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
        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, txType === 'income' && styles.typeBtnActive]}
                onPress={() => setTxType('income')}
              >
                <Ionicons name="arrow-up" size={16} color={txType === 'income' ? colors.text.inverse : colors.success} />
                <Text style={[styles.typeBtnText, txType === 'income' && styles.typeBtnTextActive]}>Receita</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, txType === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => setTxType('expense')}
              >
                <Ionicons name="arrow-down" size={16} color={txType === 'expense' ? colors.text.inverse : colors.error} />
                <Text style={[styles.typeBtnText, txType === 'expense' && styles.typeBtnTextActive]}>Despesa</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Descrição"
              placeholderTextColor={colors.text.muted}
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Valor (R$)"
              placeholderTextColor={colors.text.muted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.catLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, category === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[styles.catChipText, category === cat.id && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
              <Text style={styles.submitBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Nenhuma transação</Text>
            <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
          </View>
        ) : (
          transactions.map((tx, i) => (
            <View key={tx.id || i} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? `${colors.success}20` : `${colors.error}20` }]}>
                <Ionicons
                  name={tx.type === 'income' ? 'arrow-up' : 'arrow-down'}
                  size={18}
                  color={tx.type === 'income' ? colors.success : colors.error}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.description || tx.category}</Text>
                <Text style={styles.txMeta}>{tx.category} • {formatDate(tx.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.success : colors.error }]}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
              </Text>
            </View>
          ))
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
  formCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.xl,
    padding: spacing['2xl'], borderWidth: 1, borderColor: colors.border.DEFAULT,
    marginBottom: spacing.xl, ...shadows.md,
  },
  typeToggle: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  typeBtnActive: { backgroundColor: colors.success, borderColor: colors.success },
  typeBtnActiveExpense: { backgroundColor: colors.error, borderColor: colors.error },
  typeBtnText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  typeBtnTextActive: { color: colors.text.inverse },
  input: {
    backgroundColor: colors.background.input, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border.DEFAULT, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, color: colors.text.primary, fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
  },
  catLabel: { color: colors.text.secondary, fontSize: typography.fontSize.sm, marginBottom: spacing.sm },
  catScroll: { marginBottom: spacing.lg },
  catChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border.DEFAULT, marginRight: spacing.sm,
  },
  catChipText: { color: colors.text.secondary, fontSize: typography.fontSize.xs },
  submitBtn: {
    backgroundColor: colors.primary.DEFAULT, borderRadius: borderRadius.md,
    paddingVertical: spacing.lg, alignItems: 'center',
  },
  submitBtnText: { color: colors.text.inverse, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  emptyState: {
    alignItems: 'center', paddingVertical: spacing['5xl'],
    backgroundColor: colors.background.card, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  emptyText: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, marginTop: spacing.md },
  emptySubtext: { color: colors.text.muted, fontSize: typography.fontSize.sm, marginTop: spacing.xs },
  txItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card,
    padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: colors.border.DEFAULT, marginBottom: spacing.sm,
  },
  txIcon: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  txInfo: { flex: 1 },
  txDesc: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  txMeta: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 2 },
  txAmount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
});
