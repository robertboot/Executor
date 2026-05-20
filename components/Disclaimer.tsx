import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

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
    backgroundColor: colors.warningSoft,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 16,
  },
  boxCompact: { padding: 8, marginTop: 8 },
  title: { fontWeight: '700', color: colors.warning, marginBottom: 4 },
  body: { color: colors.warning, fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: '700' },
});
