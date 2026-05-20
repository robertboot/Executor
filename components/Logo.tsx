import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { brand, colors } from '../lib/theme';

type Variant = 'light' | 'dark' | 'compact';

/**
 * Heirloom brand mark.
 *
 * The treasure-chest illustration is hand-drawn in SVG so the app ships
 * without an external asset. When you upload your custom logo PNG to
 * `assets/heirloom-logo.png`, swap the <ChestSvg /> below for
 *   <Image source={require('../assets/heirloom-logo.png')} style={{ width: 110, height: 110 }} resizeMode="contain" />
 */
export default function Logo({ variant = 'dark' }: { variant?: Variant }) {
  const onDark = variant === 'light';
  const compact = variant === 'compact';

  return (
    <View style={styles.wrap}>
      <ChestSvg size={compact ? 64 : 110} dark={onDark} />
      <Text style={[styles.name, onDark && { color: colors.onForest }, compact && styles.nameCompact]}>
        {brand.name}
      </Text>
      {!compact && (
        <Text style={[styles.tag, onDark && { color: colors.gold }]}>{brand.tagline}</Text>
      )}
    </View>
  );
}

function ChestSvg({ size, dark }: { size: number; dark: boolean }) {
  // Colors
  const chestFill = dark ? '#0F3D2E' : '#0F3D2E';
  const chestShade = '#0A2D22';
  const chestHighlight = '#1B5340';
  const heart = '#F2EDE4';
  const tagFill = '#E6D7BD';
  const tagShade = '#C5A572';
  const goldRim = '#B89668';
  const frameGold = '#C5A572';
  const paintingSky = '#A8C7CE';
  const paintingHill = '#5E7A5A';
  const vaseWhite = '#F2EDE4';
  const vaseBlue = '#2E5A8A';
  const ropeColor = '#A0825A';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="lid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={chestHighlight} />
          <Stop offset="1" stopColor={chestFill} />
        </LinearGradient>
        <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={chestFill} />
          <Stop offset="1" stopColor={chestShade} />
        </LinearGradient>
      </Defs>

      {/* Lid back (when open) */}
      <Path
        d="M18 36 Q18 22 32 22 L88 22 Q102 22 102 36 L102 52 L18 52 Z"
        fill="url(#lid)"
        stroke={chestShade}
        strokeWidth="1"
      />

      {/* Items inside the chest */}
      <G>
        {/* Painting frame */}
        <Rect x="30" y="36" width="32" height="32" rx="2" fill={frameGold} />
        <Rect x="33" y="39" width="26" height="26" rx="1" fill={paintingSky} />
        <Path d="M33 60 L42 50 L48 55 L54 47 L59 53 L59 65 L33 65 Z" fill={paintingHill} />
        <Circle cx="52" cy="46" r="2" fill="#F5E1A1" />

        {/* Book stack */}
        <Rect x="40" y="68" width="22" height="6" rx="1" fill="#7C5A36" />
        <Rect x="40" y="74" width="22" height="5" rx="1" fill="#A47147" />

        {/* Vase */}
        <Path
          d="M75 38 Q72 42 72 50 Q68 56 72 64 Q72 72 78 76 L86 76 Q92 72 92 64 Q96 56 92 50 Q92 42 89 38 Q88 36 86 36 L78 36 Q76 36 75 38 Z"
          fill={vaseWhite}
        />
        <Path d="M76 44 Q82 46 88 44" stroke={vaseBlue} strokeWidth="0.8" fill="none" />
        <Circle cx="82" cy="56" r="3" fill={vaseBlue} opacity="0.8" />
        <Path d="M76 60 Q82 64 88 60" stroke={vaseBlue} strokeWidth="0.7" fill="none" />
        <Path d="M77 65 Q82 67 87 65" stroke={vaseBlue} strokeWidth="0.6" fill="none" />
      </G>

      {/* Chest body (front, partly covers items at bottom) */}
      <Path
        d="M16 60 Q16 56 20 56 L100 56 Q104 56 104 60 L104 96 Q104 104 96 104 L24 104 Q16 104 16 96 Z"
        fill="url(#body)"
        stroke={chestShade}
        strokeWidth="1"
      />

      {/* Chest gold rim band */}
      <Rect x="16" y="62" width="88" height="3" fill={goldRim} />
      <Rect x="16" y="92" width="88" height="3" fill={goldRim} />

      {/* Heart on front */}
      <Path
        d="M60 73 Q58 70 55 70 Q50 70 50 76 Q50 81 60 88 Q70 81 70 76 Q70 70 65 70 Q62 70 60 73 Z"
        fill={heart}
      />

      {/* Tag with $ */}
      <G>
        <Path d="M96 88 L108 88 L114 96 L108 104 L96 104 Z" fill={tagFill} stroke={tagShade} />
        <Circle cx="100" cy="96" r="1.6" fill={tagShade} />
        <Path d="M100 96 L92 90" stroke={ropeColor} strokeWidth="1.2" fill="none" />
        <Path
          d="M105 92 L108 92 M105 100 L108 100 M106 92 L106 100 M106 96 Q104 96 104 94 Q104 92 106 92 M106 96 Q108 96 108 98 Q108 100 106 100"
          stroke={tagShade}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  name: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  nameCompact: { fontSize: 18, marginTop: 0 },
  tag: {
    fontSize: 10,
    color: colors.goldDeep,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: 2,
  },
});
