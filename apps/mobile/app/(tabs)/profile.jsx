import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '@shared/theme';
import MonexLogo from '@/components/MonexLogo';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  const userName = session?.user?.user_metadata?.name || 'Usuário';
  const userEmail = session?.user?.email || '';

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Dados Pessoais', onPress: () => {} },
    { icon: 'card-outline', label: 'Assinatura', onPress: () => {} },
    { icon: 'shield-checkmark-outline', label: 'Segurança', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notificações', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Ajuda & Suporte', onPress: () => {} },
    { icon: 'document-text-outline', label: 'Termos de Uso', onPress: () => {} },
    { icon: 'lock-closed-outline', label: 'Política de Privacidade', onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color={colors.text.secondary} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <MonexLogo size="small" />
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'] },
  profileHeader: {
    alignItems: 'center', paddingVertical: spacing['3xl'],
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: borderRadius.full,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    color: colors.text.inverse, fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
  },
  profileName: {
    color: colors.text.primary, fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  profileEmail: {
    color: colors.text.muted, fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT,
  },
  menuItemLeft: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  menuItemLabel: {
    color: colors.text.primary, fontSize: typography.fontSize.base,
  },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing['2xl'],
    backgroundColor: `${colors.error}15`, borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg, borderWidth: 1, borderColor: `${colors.error}30`,
  },
  logoutText: {
    color: colors.error, fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  footer: {
    alignItems: 'center', marginTop: spacing['3xl'], gap: spacing.sm,
  },
  versionText: {
    color: colors.text.muted, fontSize: typography.fontSize.xs,
  },
});
