import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@shared/utils/formatters';
import { colors, spacing, typography, borderRadius, shadows } from '@shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

// ─── Bancos brasileiros ───────────────────────────────────
const BANKS = [
  { name: 'Nubank', color: '#820AD1', logo: 'NB' },
  { name: 'Inter', color: '#FF7A00', logo: 'IN' },
  { name: 'Itaú', color: '#EC7000', logo: 'IT' },
  { name: 'Bradesco', color: '#CC092F', logo: 'BR' },
  { name: 'Santander', color: '#EC0000', logo: 'SA' },
  { name: 'C6 Bank', color: '#242424', logo: 'C6' },
  { name: 'Outro', color: '#475569', logo: 'CC' },
];

const getBankStyle = (bankName) =>
  BANKS.find((b) => b.name === bankName) || BANKS[BANKS.length - 1];

// ─── Status de vencimento ─────────────────────────────────
const getDueStatus = (dueDay) => {
  if (!dueDay) return null;
  const today = new Date();
  const due = parseInt(dueDay, 10);
  const dueDateThisMonth = new Date(today.getFullYear(), today.getMonth(), due);
  const diffTime = dueDateThisMonth.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return null;
};

const getDueLabel = (status, dueDay) => {
  if (status === 'overdue') return `Fatura vencida! (dia ${dueDay})`;
  if (status === 'today') return `Vence hoje! (dia ${dueDay})`;
  if (status === 'soon') return `Vence em breve (dia ${dueDay})`;
  return '';
};

// ═══════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════
export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const {
    creditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addInvoiceExpense,
    refreshData,
  } = useFinancial();

  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState(null); // 'add' | 'edit' | 'invoice' | 'pay'
  const [selectedCard, setSelectedCard] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [bank, setBank] = useState('Nubank');
  const [limit, setLimit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // ─── Abrir modais ───────────────────────────────────────
  const openAdd = () => {
    resetForm();
    setModalType('add');
  };

  const openEdit = (card) => {
    setSelectedCard(card);
    setName(card.name || '');
    setBank(card.bank || 'Nubank');
    setLimit(String(card.limit || ''));
    setDueDate(String(card.dueDate || ''));
    setLastDigits(card.lastDigits || '');
    setModalType('edit');
  };

  const openInvoice = (card) => {
    setSelectedCard(card);
    setInvoiceAmount('');
    setModalType('invoice');
  };

  const openPay = (card) => {
    setSelectedCard(card);
    setModalType('pay');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCard(null);
  };

  const resetForm = () => {
    setName('');
    setBank('Nubank');
    setLimit('');
    setDueDate('');
    setLastDigits('');
  };

  // ─── Actions ───────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !limit || !dueDate) {
      Alert.alert('Erro', 'Preencha nome, limite e dia de vencimento.');
      return;
    }
    const cardData = {
      name: name.trim(),
      bank,
      limit: parseFloat(limit),
      dueDate,
      lastDigits: lastDigits || '****',
    };
    try {
      if (modalType === 'edit' && selectedCard) {
        await updateCreditCard(selectedCard.id, cardData);
        Alert.alert('Sucesso', 'Cartão atualizado!');
      } else {
        await addCreditCard(cardData);
        Alert.alert('Sucesso', 'Cartão adicionado!');
      }
      closeModal();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o cartão.');
    }
  };

  const handleDelete = (card) => {
    Alert.alert('Excluir Cartão', `Deseja realmente excluir "${card.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteCreditCard(card.id);
        },
      },
    ]);
  };

  const handleLaunchInvoice = async () => {
    const val = parseFloat(invoiceAmount.replace(',', '.'));
    if (!val || val <= 0 || !selectedCard) {
      Alert.alert('Erro', 'Informe um valor válido.');
      return;
    }
    try {
      await addInvoiceExpense(selectedCard.id, val, `Fatura ${selectedCard.bank} - ${selectedCard.name}`);
      Alert.alert('Fatura lançada!', `${formatCurrency(val)} adicionado às despesas.`);
      closeModal();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível lançar a fatura.');
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedCard || !selectedCard.currentBill || selectedCard.currentBill <= 0) {
      Alert.alert('Sem fatura', 'Este cartão não possui fatura em aberto.');
      closeModal();
      return;
    }
    try {
      await updateCreditCard(selectedCard.id, { currentBill: 0 });
      Alert.alert('Pagamento confirmado! ✓', `Fatura de ${formatCurrency(selectedCard.currentBill)} foi paga.`);
      closeModal();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível processar o pagamento.');
    }
  };

  // ═══════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meus Cartões</Text>
          <Text style={styles.subtitle}>Gerencie limites, vencimentos e faturas</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
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
        {creditCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={56} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Nenhum cartão cadastrado</Text>
            <Text style={styles.emptySubtext}>Adicione seus cartões para controlar faturas e limites.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
              <Ionicons name="add-circle" size={20} color={colors.text.inverse} />
              <Text style={styles.emptyAddBtnText}>Adicionar Cartão</Text>
            </TouchableOpacity>
          </View>
        ) : (
          creditCards.map((card, i) => {
            const bankStyle = getBankStyle(card.bank);
            const available = (card.limit || 0) - (card.currentBill || 0);
            const usagePercent = card.limit > 0 ? Math.min(((card.currentBill || 0) / card.limit) * 100, 100) : 0;
            const dueStatus = getDueStatus(card.dueDate);
            const hasBill = (card.currentBill || 0) > 0;

            return (
              <View key={card.id || i} style={styles.cardBlock}>
                {/* ─── Alerta de vencimento ─── */}
                {dueStatus && hasBill && (
                  <View
                    style={[
                      styles.dueAlert,
                      dueStatus === 'overdue'
                        ? styles.dueAlertOverdue
                        : dueStatus === 'today'
                        ? styles.dueAlertToday
                        : styles.dueAlertSoon,
                    ]}
                  >
                    <View style={styles.dueAlertLeft}>
                      <Ionicons
                        name="warning"
                        size={18}
                        color={dueStatus === 'overdue' ? '#FCA5A5' : '#FCD34D'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dueAlertTitle,
                            { color: dueStatus === 'overdue' ? '#FCA5A5' : '#FCD34D' },
                          ]}
                        >
                          {getDueLabel(dueStatus, card.dueDate)}
                        </Text>
                        <Text style={styles.dueAlertAmount}>
                          Valor: <Text style={{ color: '#fff', fontWeight: '700' }}>{formatCurrency(card.currentBill)}</Text>
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.duePayBtn,
                        { backgroundColor: dueStatus === 'overdue' ? '#DC2626' : '#D97706' },
                      ]}
                      onPress={() => openPay(card)}
                    >
                      <Ionicons name="cash-outline" size={14} color="#fff" />
                      <Text style={styles.duePayBtnText}>Pagar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ─── Visual do Cartão ─── */}
                <View style={[styles.cardVisual, { backgroundColor: bankStyle.color }]}>
                  {/* Background decorations */}
                  <View style={styles.cardCircle1} />
                  <View style={styles.cardCircle2} />

                  <View style={styles.cardContent}>
                    {/* Topo: chip + banco */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardChip}>
                        <View style={styles.cardChipLine} />
                      </View>
                      <Text style={styles.cardBankName}>{card.bank}</Text>
                    </View>

                    {/* Centro: saldo disponível */}
                    <View style={{ marginTop: 'auto' }}>
                      <Text style={styles.cardAvailableLabel}>Saldo Disponível</Text>
                      <Text style={styles.cardAvailableValue}>{formatCurrency(available)}</Text>
                    </View>

                    {/* Rodapé: nome, vencimento, dígitos */}
                    <View style={styles.cardBottomRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardSmallLabel}>Titular</Text>
                        <Text style={styles.cardSmallValue} numberOfLines={1}>
                          {card.name?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.cardSmallLabel}>Vencimento</Text>
                        <Text style={styles.cardSmallValue}>Dia {card.dueDate}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.cardSmallLabel}>Número</Text>
                        <Text style={styles.cardDigits}>•••• {card.lastDigits || '****'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ─── Painel de informações e ações ─── */}
                <View style={styles.cardPanel}>
                  {/* Barra de uso */}
                  <View style={styles.usageHeader}>
                    <Text style={styles.usageLabel}>Limite Utilizado</Text>
                    <Text
                      style={[styles.usagePercent, usagePercent > 80 && { color: colors.error }]}
                    >
                      {usagePercent.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.usageBarBg}>
                    <View
                      style={[
                        styles.usageBarFill,
                        {
                          width: `${usagePercent}%`,
                          backgroundColor:
                            usagePercent > 90
                              ? '#EF4444'
                              : usagePercent > 50
                              ? '#F59E0B'
                              : '#10B981',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.usageFooter}>
                    <Text style={styles.usageFooterText}>
                      Fatura: <Text style={{ color: '#fff', fontWeight: '700' }}>{formatCurrency(card.currentBill || 0)}</Text>
                    </Text>
                    <Text style={styles.usageFooterText}>Total: {formatCurrency(card.limit)}</Text>
                  </View>

                  {/* Botões de ação */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openInvoice(card)}>
                      <Ionicons name="document-text-outline" size={18} color={colors.primary.DEFAULT} />
                      <Text style={styles.actionBtnText}>Lançar Fatura</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPay]}
                      onPress={() => openPay(card)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Pagar</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtnSmall} onPress={() => openEdit(card)}>
                      <Ionicons name="pencil-outline" size={16} color="#60A5FA" />
                      <Text style={[styles.actionBtnSmallText, { color: '#60A5FA' }]}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnSmall} onPress={() => handleDelete(card)}>
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                      <Text style={[styles.actionBtnSmallText, { color: '#F87171' }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ═══ Modal: Adicionar / Editar Cartão ═══ */}
      <Modal
        visible={modalType === 'add' || modalType === 'edit'}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom || 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalType === 'edit' ? 'Editar Cartão' : 'Novo Cartão'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nome */}
              <Text style={styles.fieldLabel}>Apelido do Cartão</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Nubank Principal"
                placeholderTextColor={colors.text.muted}
                value={name}
                onChangeText={setName}
              />

              {/* Banco (selector horizontal) */}
              <Text style={styles.fieldLabel}>Banco Emissor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
                {BANKS.map((b) => (
                  <TouchableOpacity
                    key={b.name}
                    style={[
                      styles.bankChip,
                      { borderColor: bank === b.name ? b.color : colors.border.DEFAULT },
                      bank === b.name && { backgroundColor: b.color + '25' },
                    ]}
                    onPress={() => setBank(b.name)}
                  >
                    <View style={[styles.bankDot, { backgroundColor: b.color }]} />
                    <Text
                      style={[
                        styles.bankChipText,
                        bank === b.name && { color: '#fff', fontWeight: '600' },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Limite + Vencimento */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Limite (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.muted}
                    value={limit}
                    onChangeText={setLimit}
                    keyboardType="decimal-pad"
                  />
                  {limit ? (
                    <Text style={styles.fieldHint}>{formatCurrency(parseFloat(limit) || 0)}</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Dia Vencimento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1-31"
                    placeholderTextColor={colors.text.muted}
                    value={dueDate}
                    onChangeText={setDueDate}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>

              {/* Últimos 4 dígitos */}
              <Text style={styles.fieldLabel}>Últimos 4 Dígitos</Text>
              <TextInput
                style={styles.input}
                placeholder="1234"
                placeholderTextColor={colors.text.muted}
                value={lastDigits}
                onChangeText={setLastDigits}
                keyboardType="number-pad"
                maxLength={4}
              />
            </ScrollView>

            {/* Botões */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Salvar Cartão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ Modal: Lançar Fatura ═══ */}
      <Modal visible={modalType === 'invoice'} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom || 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Lançar Fatura</Text>
            {selectedCard && (
              <Text style={styles.modalSubtitle}>
                {selectedCard.bank} — {selectedCard.name}
              </Text>
            )}

            <View style={styles.invoiceInfoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary.DEFAULT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.invoiceInfoText}>Este processo irá:</Text>
                <Text style={styles.invoiceInfoBullet}>• Adicionar o valor como despesa no histórico</Text>
                <Text style={styles.invoiceInfoBullet}>• Atualizar o uso do limite do cartão</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Valor Total da Fatura (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              value={invoiceAmount}
              onChangeText={setInvoiceAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleLaunchInvoice}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.modalSaveText}>Confirmar Lançamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ Modal: Pagar Fatura ═══ */}
      <Modal visible={modalType === 'pay'} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentSmall, { paddingBottom: insets.bottom || 24 }]}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Confirmar Pagamento</Text>

            {selectedCard && (
              <View style={styles.payInfoBox}>
                <Text style={styles.payInfoLabel}>Cartão</Text>
                <Text style={styles.payInfoValue}>{selectedCard.name} ({selectedCard.bank})</Text>
                <Text style={[styles.payInfoLabel, { marginTop: 12 }]}>Valor da Fatura</Text>
                <Text style={[styles.payInfoValue, { fontSize: 24, color: '#10B981' }]}>
                  {formatCurrency(selectedCard.currentBill || 0)}
                </Text>
              </View>
            )}

            {(!selectedCard?.currentBill || selectedCard.currentBill <= 0) && (
              <View style={styles.noBillBox}>
                <Ionicons name="checkmark-done" size={20} color={colors.primary.DEFAULT} />
                <Text style={styles.noBillText}>Este cartão não possui fatura em aberto!</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              {selectedCard?.currentBill > 0 && (
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: '#10B981' }]}
                  onPress={handlePayInvoice}
                >
                  <Ionicons name="cash-outline" size={18} color="#fff" />
                  <Text style={styles.modalSaveText}>Confirmar Pagamento</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'] },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyAddBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },

  // ─── Card Block ───
  cardBlock: { marginBottom: spacing['2xl'] },

  // Due Alert
  dueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  dueAlertOverdue: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  dueAlertToday: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  dueAlertSoon: {
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderColor: 'rgba(234,179,8,0.3)',
  },
  dueAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dueAlertTitle: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  dueAlertAmount: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  duePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  duePayBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // ─── Card Visual (realistic credit card) ───
  cardVisual: {
    width: '100%',
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    ...shadows.lg,
  },
  cardCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cardContent: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardChip: {
    width: 40,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(250,204,21,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardChipLine: {
    width: '50%',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  cardBankName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.9,
  },
  cardAvailableLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardAvailableValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardSmallLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSmallValue: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 1 },
  cardDigits: {
    color: '#fff',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 1,
  },

  // ─── Card Panel (info + actions) ───
  cardPanel: {
    backgroundColor: colors.background.card,
    marginTop: -12,
    marginHorizontal: 6,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border.DEFAULT,
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  usageLabel: { color: colors.text.muted, fontSize: typography.fontSize.xs },
  usagePercent: { color: '#fff', fontSize: typography.fontSize.xs, fontWeight: '600' },
  usageBarBg: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  usageBarFill: { height: '100%', borderRadius: 4 },
  usageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  usageFooterText: { color: colors.text.muted, fontSize: 11 },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderStyle: 'dashed',
    backgroundColor: colors.background.DEFAULT,
  },
  actionBtnPay: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderStyle: 'solid',
  },
  actionBtnText: {
    color: colors.primary.DEFAULT,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  actionBtnSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.DEFAULT,
  },
  actionBtnSmallText: { fontSize: typography.fontSize.xs, fontWeight: '500' },

  // ═══ Modal Styles ═══
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing['2xl'],
    maxHeight: '88%',
  },
  modalContentSmall: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing['2xl'],
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.DEFAULT,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  fieldHint: {
    color: colors.primary.DEFAULT,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  rowFields: { flexDirection: 'row', gap: spacing.md },

  // Bank selector
  bankScroll: { marginBottom: spacing.sm },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  bankDot: { width: 10, height: 10, borderRadius: 5 },
  bankChipText: { color: colors.text.secondary, fontSize: 13 },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
  },
  modalCancelText: { color: colors.text.muted, fontWeight: '500' },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.DEFAULT,
  },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: typography.fontSize.base },

  // Invoice info
  invoiceInfoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.background.DEFAULT,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginTop: spacing.md,
  },
  invoiceInfoText: { color: colors.text.muted, fontSize: 12, marginBottom: 4 },
  invoiceInfoBullet: { color: colors.text.muted, fontSize: 11 },

  // Pay confirmation
  payInfoBox: {
    backgroundColor: colors.background.DEFAULT,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  payInfoLabel: { color: colors.text.muted, fontSize: 12 },
  payInfoValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  noBillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.background.DEFAULT,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  noBillText: { color: colors.text.secondary, fontSize: 13 },
});
