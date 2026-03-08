/**
 * Layout de navegação stack para telas de detalhe do Open Finance.
 * O Expo Router cria automaticamente rotas para cada arquivo nesta pasta.
 */

import { Stack } from 'expo-router';
import { colors } from '@shared/theme';

export default function OpenFinanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.DEFAULT },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="connect" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="account-detail" />
      <Stack.Screen name="credit-cards" />
      <Stack.Screen name="card-detail" />
    </Stack>
  );
}
