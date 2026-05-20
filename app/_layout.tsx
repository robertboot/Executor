import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import SetupNeeded from '../components/SetupNeeded';
import { AuthProvider } from '../lib/auth';
import { SUPABASE_CONFIGURED } from '../lib/supabase';

export default function RootLayout() {
  if (!SUPABASE_CONFIGURED) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SetupNeeded />
      </SafeAreaProvider>
    );
  }
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#111827',
                headerTitleStyle: { fontWeight: '600' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: 'Sign in' }} />
              <Stack.Screen name="signup" options={{ title: 'Create account' }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
              <Stack.Screen
                name="i/[public_id]"
                options={{ title: 'Heirloom', headerShown: false }}
              />
            </Stack>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
