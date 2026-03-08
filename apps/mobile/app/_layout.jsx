import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { FinancialProvider } from '@/contexts/FinancialContext';
import { OpenFinanceProvider } from '@/contexts/OpenFinanceContext';
import { colors } from '@shared/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <FinancialProvider>
        <OpenFinanceProvider>
          <View style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
            <StatusBar style="light" backgroundColor={colors.background.DEFAULT} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background.DEFAULT },
                animation: 'slide_from_right',
              }}
            />
          </View>
        </OpenFinanceProvider>
      </FinancialProvider>
    </AuthProvider>
  );
}
