import { Stack } from 'expo-router';

export default function CollectionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[key]" />
      <Stack.Screen name="new" />
    </Stack>
  );
}
