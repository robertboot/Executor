import { Image, StyleSheet, View } from 'react-native';

type Variant = 'light' | 'dark' | 'compact';

/**
 * Heirloom brand mark — renders the composed PNG logo
 * (chest illustration + wordmark + tagline) as a single image.
 */
export default function Logo({ variant = 'dark' }: { variant?: Variant }) {
  const size = variant === 'compact' ? 72 : 180;
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../assets/heirloom-logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
