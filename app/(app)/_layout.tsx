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
        headerShown: false,
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
          tabBarIcon: ({ color }) => <Glyph color={color}>H</Glyph>,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => <Glyph color={color}>C</Glyph>,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <Glyph color={color}>S</Glyph>,
        }}
      />
      <Tabs.Screen
        name="conservators"
        options={{
          title: 'Conservators',
          tabBarIcon: ({ color }) => <Glyph color={color}>K</Glyph>,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Glyph color={color}>M</Glyph>,
        }}
      />

      {/* Non-tab routes that share this directory — declare them so
          expo-router doesn't try to add them as tabs. */}
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
      <Tabs.Screen name="new-inventory" options={{ href: null, title: 'New inventory' }} />
      <Tabs.Screen name="invites" options={{ href: null, title: 'Invites' }} />
      <Tabs.Screen name="inventory" options={{ href: null, title: 'Inventory' }} />
    </Tabs>
  );
}

function Glyph({ children, color }: { children: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{children}</Text>
  );
}
