import { Stack } from 'expo-router';
import { colors } from '../../../lib/theme';

export default function ConservatorsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
      }}
    >
      <Stack.Screen name="new" options={{ title: 'New conservator' }} />
    </Stack>
  );
}
