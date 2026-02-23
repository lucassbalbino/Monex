import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@shared/theme';

/**
 * Logo da Monex — identidade visual compartilhada
 * @param {{ size?: 'small' | 'medium' | 'large' }} props
 */
export default function MonexLogo({ size = 'medium' }) {
  const sizes = {
    small: { fontSize: 20, iconSize: 24 },
    medium: { fontSize: 28, iconSize: 32 },
    large: { fontSize: 36, iconSize: 40 },
  };

  const s = sizes[size] || sizes.medium;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { width: s.iconSize, height: s.iconSize }]}>
        <Text style={[styles.iconText, { fontSize: s.iconSize * 0.55 }]}>M</Text>
      </View>
      <Text style={[styles.brandName, { fontSize: s.fontSize }]}>Monex</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.extrabold,
  },
  brandName: {
    color: colors.primary.DEFAULT,
    fontWeight: typography.fontWeight.bold,
  },
});
