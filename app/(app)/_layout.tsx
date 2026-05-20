import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
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
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon glyph="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarLabel: 'Collections',
          tabBarIcon: ({ color }) => <TabIcon glyph="◇" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon glyph="⚙" color={color} />,
        }}
      />

      {/* Non-tab routes — accessible but hidden from the tab bar. */}
      <Tabs.Screen name="new-inventory" options={{ href: null, title: 'New inventory' }} />
      <Tabs.Screen name="invites" options={{ href: null, title: 'Invites' }} />
      <Tabs.Screen name="scan" options={{ href: null, title: 'Scan QR' }} />
      <Tabs.Screen name="collections/[key]" options={{ href: null, title: 'Collection' }} />
      <Tabs.Screen name="inventory/[id]/index" options={{ href: null, title: 'Inventory' }} />
      <Tabs.Screen
        name="inventory/[id]/settings"
        options={{ href: null, title: 'Inventory settings' }}
      />
      <Tabs.Screen
        name="inventory/[id]/labels"
        options={{ href: null, title: 'Print labels' }}
      />
      <Tabs.Screen
        name="inventory/[id]/export"
        options={{ href: null, title: 'Export' }}
      />
      <Tabs.Screen
        name="inventory/[id]/item/new"
        options={{ href: null, title: 'New item' }}
      />
      <Tabs.Screen
        name="inventory/[id]/item/[itemId]/index"
        options={{ href: null, title: 'Item' }}
      />
      <Tabs.Screen
        name="inventory/[id]/item/[itemId]/edit"
        options={{ href: null, title: 'Edit item' }}
      />
      <Tabs.Screen
        name="inventory/[id]/item/[itemId]/history"
        options={{ href: null, title: 'History' }}
      />
      <Tabs.Screen
        name="inventory/[id]/item/[itemId]/qr"
        options={{ href: null, title: 'QR code' }}
      />
    </Tabs>
  );
}

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 22, marginTop: 2 }}>{glyph}</Text>
  );
}
