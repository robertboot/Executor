import { StyleSheet, Text, View } from 'react-native';

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <Text style={styles.title}>Important</Text>
      <Text style={styles.body}>
        Heirloom is a personal inventory tool. It is{' '}
        <Text style={styles.bold}>not a will</Text>, not legal or estate advice, and not a
        substitute for either. To make legally-binding decisions about who inherits your
        property, please consult an attorney and prepare a proper will.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  boxCompact: { padding: 8, marginTop: 8 },
  title: { fontWeight: '700', color: '#78350f', marginBottom: 4 },
  body: { color: '#78350f', fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: '700' },
});
