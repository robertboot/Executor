import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import SetupNeeded from '../components/SetupNeeded';
import { AuthProvider } from '../lib/auth';
import { SUPABASE_CONFIGURED } from '../lib/supabase';

export default function RootLayout() {
  if (!SUPABASE_CONFIGURED) {
    return <SetupNeeded />;
  }
  const content = (
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
  );

  // On web, the GestureHandlerRootView + SafeAreaProvider wrappers can
  // sometimes interact poorly with the bundle. Render the bare content
  // there and only wrap on native.
  if (Platform.OS === 'web') {
    return <ErrorBoundary>{content}</ErrorBoundary>;
  }
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>{content}</SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
