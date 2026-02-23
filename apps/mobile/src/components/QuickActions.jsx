import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@shared/theme';

const actions = [
  { icon: 'add-circle-outline', label: 'Adicionar', color: colors.primary.DEFAULT, tab: 'tracking' },
  { icon: 'flag-outline', label: 'Nova Meta', color: '#A855F7', tab: 'goals' },
  { icon: 'chatbubble-ellipses-outline', label: 'ClawdBot', color: '#3B82F6', tab: 'chat' },
  { icon: 'card-outline', label: 'Cartões', color: '#F59E0B', tab: null },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ações Rápidas</Text>
      <View style={styles.grid}>
        {actions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionBtn}
            onPress={() => action.tab && router.push(`/(tabs)/${action.tab}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${action.color}20` }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    width: '22%',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});
