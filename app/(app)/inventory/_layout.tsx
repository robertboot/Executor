import { Stack } from 'expo-router';
import { colors } from '../../../lib/theme';

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
      }}
    >
      <Stack.Screen name="[id]/index" options={{ title: 'Inventory' }} />
      <Stack.Screen name="[id]/settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="[id]/labels" options={{ title: 'Print labels' }} />
      <Stack.Screen name="[id]/export" options={{ title: 'Export' }} />
      <Stack.Screen name="[id]/item/new" options={{ title: 'New item' }} />
      <Stack.Screen name="[id]/item/[itemId]/index" options={{ title: 'Item' }} />
      <Stack.Screen name="[id]/item/[itemId]/edit" options={{ title: 'Edit item' }} />
      <Stack.Screen name="[id]/item/[itemId]/history" options={{ title: 'History' }} />
      <Stack.Screen name="[id]/item/[itemId]/qr" options={{ title: 'QR code' }} />
    </Stack>
  );
}
