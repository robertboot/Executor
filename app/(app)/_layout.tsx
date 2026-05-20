import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../lib/auth';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My inventories' }} />
      <Stack.Screen name="new-inventory" options={{ title: 'New inventory' }} />
      <Stack.Screen name="invites" options={{ title: 'Invites' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="inventory/[id]/index" options={{ title: 'Inventory' }} />
      <Stack.Screen name="inventory/[id]/settings" options={{ title: 'Inventory settings' }} />
      <Stack.Screen name="inventory/[id]/labels" options={{ title: 'Print labels' }} />
      <Stack.Screen name="inventory/[id]/export" options={{ title: 'Export' }} />
      <Stack.Screen name="inventory/[id]/item/new" options={{ title: 'New item' }} />
      <Stack.Screen name="inventory/[id]/item/[itemId]/index" options={{ title: 'Item' }} />
      <Stack.Screen name="inventory/[id]/item/[itemId]/edit" options={{ title: 'Edit item' }} />
      <Stack.Screen
        name="inventory/[id]/item/[itemId]/history"
        options={{ title: 'History' }}
      />
      <Stack.Screen name="inventory/[id]/item/[itemId]/qr" options={{ title: 'QR code' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan QR' }} />
    </Stack>
  );
}
