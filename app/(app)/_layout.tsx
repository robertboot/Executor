import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { colors } from '../../lib/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.cream,
        }}
      >
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        tabBarStyle: {
          backgroundColor: colors.forest,
          borderTopColor: colors.forestDeep,
          paddingTop: 8,
          height: 72,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.onForestMuted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11, marginBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Glyph color={color}>⌂</Glyph>,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => <Glyph color={color}>◇</Glyph>,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <ScanGlyph color={color} />,
        }}
      />
      <Tabs.Screen
        name="conservators"
        options={{
          title: 'Conservators',
          tabBarIcon: ({ color }) => <Glyph color={color}>👥</Glyph>,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Glyph color={color}>⋯</Glyph>,
        }}
      />

      {/* Hidden but addressable routes. */}
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
      <Tabs.Screen name="new-inventory" options={{ href: null, title: 'New inventory' }} />
      <Tabs.Screen name="invites" options={{ href: null, title: 'Invites' }} />
      <Tabs.Screen name="collections/[key]" options={{ href: null, title: 'Collection' }} />
      <Tabs.Screen name="collections/new" options={{ href: null, title: 'New collection' }} />
      <Tabs.Screen name="conservators/new" options={{ href: null, title: 'New conservator' }} />
      <Tabs.Screen name="inventory/[id]/index" options={{ href: null, title: 'Inventory' }} />
      <Tabs.Screen
        name="inventory/[id]/settings"
        options={{ href: null, title: 'Inventory settings' }}
      />
      <Tabs.Screen
        name="inventory/[id]/labels"
        options={{ href: null, title: 'Print labels' }}
      />
      <Tabs.Screen name="inventory/[id]/export" options={{ href: null, title: 'Export' }} />
      <Tabs.Screen name="inventory/[id]/item/new" options={{ href: null, title: 'New item' }} />
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

function Glyph({ children, color }: { children: string; color: string }) {
  return <Text style={{ color, fontSize: 20, marginTop: 2 }}>{children}</Text>;
}

function ScanGlyph({ color }: { color: string }) {
  // Slightly raised "scanner" target glyph.
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -8,
      }}
    >
      <Text style={{ color, fontSize: 18, fontWeight: '700' }}>⊡</Text>
    </View>
  );
}
