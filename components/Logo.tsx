import { Image, StyleSheet, View } from 'react-native';

type Variant = 'light' | 'dark' | 'compact';

/**
 * Heirloom brand mark — renders the composed PNG logo
 * (chest illustration + wordmark + tagline) as a single image.
 */
export default function Logo({ variant = 'dark' }: { variant?: Variant }) {
  const width = variant === 'compact' ? 160 : 260;
  const height = variant === 'compact' ? 48 : 80;
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../assets/heirloom-logo-horizontal.png')}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
