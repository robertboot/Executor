import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Disclaimer from '../../components/Disclaimer';
import { useAuth } from '../../lib/auth';

export default function AppSettings() {
  const { user, signOut } = useAuth();

  const onSignOut = () => {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.value}>{user?.email}</Text>

      <Disclaimer />

      <Pressable style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { color: '#6b7280', marginTop: 8 },
  value: { color: '#111827', fontWeight: '500', fontSize: 16 },
  button: {
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#111827', fontWeight: '600' },
});
