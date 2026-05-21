import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { colors } from '../../lib/theme';

export default function Home() {
  const { user } = useAuth();
  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Heirloom</Text>
      <Text style={styles.body}>Signed in as {user?.email ?? '(no user)'}</Text>
      <View style={styles.card}>
        <Text style={styles.body}>If you can read this, the home renders cleanly.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  body: { color: colors.inkSoft, lineHeight: 22 },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});
