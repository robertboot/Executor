import { useWindowDimensions } from 'react-native';

/**
 * Single source of truth for responsive breakpoints across the app.
 *
 * - phone:   < 768px (default mobile / portrait iPad mini)
 * - tablet:  >= 768px and < 1024px (landscape iPad, large phones in landscape)
 * - desktop: >= 1024px (browsers on Mac / PC)
 *
 * Use:
 *   const { isPhone, isTablet, isDesktop, isWide } = useBreakpoint();
 *
 * `isWide` is a convenience for tablet OR desktop — i.e. anywhere a
 * master-detail or sidebar layout makes sense.
 */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 768;
  return { width, height, isPhone, isTablet, isDesktop, isWide };
}
